from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from dsa.models import Problem
from .models import AIRequest
from .serializers import AIRequestSerializer
from .services import call_ai, call_ai_pro, generate_plan


class _BaseAIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    request_type = ''
    use_pro      = False

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message    = serializer.validated_data['message']
        problem_id = serializer.validated_data.get('problem_id')
        problem    = None

        if problem_id:
            try:
                problem = Problem.objects.get(id=problem_id, is_active=True)
            except Problem.DoesNotExist:
                return Response({'detail': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            fn         = call_ai_pro if self.use_pro else call_ai
            ai_response = fn(self.request_type, message, problem)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        AIRequest.objects.create(
            user=request.user,
            problem=problem,
            request_type=self.request_type,
            user_input=message,
            ai_response=ai_response,
        )

        return Response({'response': ai_response})


class HintView(_BaseAIView):
    request_type = 'hint'


class ExplainView(_BaseAIView):
    request_type = 'explain'


class DebugView(_BaseAIView):
    request_type = 'debug'


# ── Plan generation ───────────────────────────────────────────────────────────

class GeneratePlanView(APIView):
    """
    POST /api/ai/generate-plan/
    Body: { intensity: 'Light'|'Balanced'|'Intense' }
    Fetches the user's weak areas from analytics and uses AI to build a plan.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        intensity = request.data.get('intensity', 'Balanced')
        if intensity not in ('Light', 'Balanced', 'Intense'):
            intensity = 'Balanced'

        # Gather weak areas from platform topic stats
        from analytics.models import PlatformProfile, TopicStats
        from django.db.models import Q

        profiles = PlatformProfile.objects.filter(user=request.user).prefetch_related('topic_stats', 'stats')

        weak_areas = []
        topic_map: dict[str, dict] = {}

        # LeetCode priority, then Codeforces
        for priority in ('leetcode', 'codeforces'):
            for prof in profiles:
                if prof.platform_name != priority:
                    continue
                for ts in prof.topic_stats.order_by('problems_solved'):
                    slug = ts.topic_slug
                    if slug not in topic_map:
                        topic_map[slug] = {
                            'topic_name':     ts.topic_name,
                            'problems_solved': ts.problems_solved,
                            'platform':       prof.platform_name,
                        }

        weak_areas = sorted(topic_map.values(), key=lambda x: x['problems_solved'])[:5]

        # Aggregate user stats
        total_solved = easy = medium = hard = rating = 0
        for prof in profiles:
            s = getattr(prof, 'stats', None)
            if s:
                total_solved += s.problems_solved
                easy         += s.easy_solved
                medium        += s.medium_solved
                hard          += s.hard_solved
                rating         = max(rating, s.rating)

        user_stats = {
            'total_solved': total_solved,
            'easy_solved':  easy,
            'medium_solved': medium,
            'hard_solved':  hard,
            'rating':       rating,
        }

        plan = generate_plan(weak_areas, intensity, user_stats)
        return Response(plan)
