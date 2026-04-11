from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from dsa.models import Problem
from .models import AIRequest
from .serializers import AIRequestSerializer
from .services import call_ai


class _BaseAIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    request_type = ''

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
            ai_response = call_ai(self.request_type, message, problem)
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
