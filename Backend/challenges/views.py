"""
Challenges views — Friends Code Party.
"""
import requests
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import PlatformProfile
from .models import Party, PartyMember, PartyQuestion, QuestionCompletion
from .serializers import (
    PartySerializer, CreatePartySerializer, AddQuestionSerializer,
)
from .problem_pool import shuffle_for_party

LEETCODE_GQL = 'https://leetcode.com/graphql'
CF_API       = 'https://codeforces.com/api'
LC_HEADERS   = {
    'Content-Type': 'application/json',
    'Referer': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0',
}


# ── helpers ──────────────────────────────────────────────────────────

def _lc_accepted_slugs(handle: str, limit: int = 100) -> set:
    query = 'query($u:String!,$l:Int!){recentAcSubmissionList(username:$u,limit:$l){titleSlug}}'
    try:
        r = requests.post(LEETCODE_GQL, json={'query': query, 'variables': {'u': handle, 'l': limit}},
                          headers=LC_HEADERS, timeout=12)
        subs = r.json().get('data', {}).get('recentAcSubmissionList') or []
        return {s['titleSlug'] for s in subs}
    except Exception:
        return set()


def _cf_accepted_slugs(handle: str, limit: int = 200) -> set:
    try:
        r = requests.get(f'{CF_API}/user.status?handle={handle}&from=1&count={limit}', timeout=15)
        data = r.json()
        if data.get('status') != 'OK':
            return set()
        slugs = set()
        for sub in data['result']:
            if sub.get('verdict') == 'OK':
                p = sub['problem']
                slugs.add(f"{p.get('contestId','')}-{p.get('index','')}")
        return slugs
    except Exception:
        return set()


def _check_lc_solved(handle: str, slug: str, since_ts: float) -> bool:
    query = 'query($u:String!,$l:Int!){recentAcSubmissionList(username:$u,limit:$l){titleSlug timestamp}}'
    try:
        r = requests.post(LEETCODE_GQL, json={'query': query, 'variables': {'u': handle, 'l': 50}},
                          headers=LC_HEADERS, timeout=12)
        subs = r.json().get('data', {}).get('recentAcSubmissionList') or []
        return any(s['titleSlug'] == slug and int(s.get('timestamp', 0)) >= since_ts for s in subs)
    except Exception:
        return False


def _check_cf_solved(handle: str, slug: str, since_ts: float) -> bool:
    try:
        r = requests.get(f'{CF_API}/user.status?handle={handle}&from=1&count=50', timeout=15)
        data = r.json()
        if data.get('status') != 'OK':
            return False
        for sub in data['result']:
            if sub.get('verdict') == 'OK':
                p   = sub['problem']
                key = f"{p.get('contestId','')}-{p.get('index','')}"
                ts  = sub.get('creationTimeSeconds', 0)
                if key == slug and ts >= since_ts:
                    return True
        return False
    except Exception:
        return False


def _get_party_or_404(code):
    try:
        return Party.objects.select_related('host').prefetch_related(
            'members__user', 'members__completions__question', 'questions'
        ).get(code=code.upper()), None
    except Party.DoesNotExist:
        return None, Response({'detail': 'Party not found.'}, status=status.HTTP_404_NOT_FOUND)


def _assign_ranks(party):
    finished = list(party.members.filter(finished_at__isnull=False).order_by('finished_at'))
    for i, m in enumerate(finished, start=1):
        if m.rank != i:
            m.rank = i
            m.save(update_fields=['rank'])


# ── Views ─────────────────────────────────────────────────────────────

class CreatePartyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = CreatePartySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        party = Party.objects.create(
            host=request.user, name=d['name'],
            duration_minutes=d['duration_minutes'],
            max_questions=d['max_questions'],
            question_mode=d['question_mode'],
        )
        PartyMember.objects.create(party=party, user=request.user)
        return Response(PartySerializer(party, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class JoinPartyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.status != 'waiting':
            return Response({'detail': 'Party already started or finished.'}, status=400)
        member, created = PartyMember.objects.get_or_create(party=party, user=request.user)
        return Response(PartySerializer(party, context={'request': request}).data,
                        status=201 if created else 200)


class PartyDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.is_expired and party.status == 'active':
            party.status = 'finished'
            party.save(update_fields=['status'])
            _assign_ranks(party)
        return Response(PartySerializer(party, context={'request': request}).data)


class StartPartyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can start.'}, status=403)
        if party.status != 'waiting':
            return Response({'detail': 'Party cannot be started.'}, status=400)
        if party.questions.count() == 0:
            return Response({'detail': 'Add at least one question before starting.'}, status=400)
        now = timezone.now()
        party.status = 'active'
        party.started_at = now
        party.ends_at = now + timezone.timedelta(minutes=party.duration_minutes)
        party.save(update_fields=['status', 'started_at', 'ends_at'])
        return Response(PartySerializer(party, context={'request': request}).data)


class AddQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can add questions.'}, status=403)
        if party.status != 'waiting':
            return Response({'detail': 'Cannot modify after start.'}, status=400)
        if party.questions.count() >= party.max_questions:
            return Response({'detail': f'Max {party.max_questions} questions.'}, status=400)
        ser = AddQuestionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        q = PartyQuestion.objects.create(
            party=party, title=d['title'], platform=d['platform'],
            url=d['url'], slug=d['slug'], difficulty=d['difficulty'],
            order=party.questions.count(),
        )
        from .serializers import PartyQuestionSerializer
        return Response(PartyQuestionSerializer(q).data, status=201)


class RemoveQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, code, qid):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can remove questions.'}, status=403)
        if party.status != 'waiting':
            return Response({'detail': 'Cannot modify after start.'}, status=400)
        try:
            party.questions.get(id=qid).delete()
        except PartyQuestion.DoesNotExist:
            return Response({'detail': 'Question not found.'}, status=404)
        return Response(status=204)


class ShuffleQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can shuffle.'}, status=403)
        if party.status != 'waiting':
            return Response({'detail': 'Cannot modify after start.'}, status=400)

        solved: set = set()
        for m in party.members.select_related('user'):
            for profile in PlatformProfile.objects.filter(user=m.user):
                if profile.platform_name == 'leetcode' and profile.handle:
                    solved.update(_lc_accepted_slugs(profile.handle))
                elif profile.platform_name == 'codeforces' and profile.handle:
                    solved.update(_cf_accepted_slugs(profile.handle))

        chosen = shuffle_for_party(solved, count=party.max_questions)
        party.questions.all().delete()
        for i, (title, slug, platform, url, diff) in enumerate(chosen):
            PartyQuestion.objects.create(
                party=party, title=title, slug=slug,
                platform=platform, url=url, difficulty=diff, order=i,
            )
        return Response(PartySerializer(party, context={'request': request}).data)


class CheckCompletionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code, qid):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.status != 'active':
            return Response({'detail': 'Party not active.'}, status=400)
        try:
            question = party.questions.get(id=qid)
            member   = party.members.get(user=request.user)
        except (PartyQuestion.DoesNotExist, PartyMember.DoesNotExist):
            return Response({'detail': 'Not found.'}, status=404)

        if QuestionCompletion.objects.filter(member=member, question=question, verified=True).exists():
            return Response({'verified': True, 'already_done': True})

        since_ts = party.started_at.timestamp() if party.started_at else 0
        verified = False
        profile = PlatformProfile.objects.filter(user=request.user, platform_name=question.platform).first()
        if profile and profile.handle:
            if question.platform == 'leetcode':
                verified = _check_lc_solved(profile.handle, question.slug, since_ts)
            elif question.platform == 'codeforces':
                verified = _check_cf_solved(profile.handle, question.slug, since_ts)

        if verified:
            QuestionCompletion.objects.get_or_create(member=member, question=question,
                                                     defaults={'verified': True})
            done = member.completions.filter(verified=True).count()
            if done >= party.questions.count() and not member.finished_at:
                member.finished_at = timezone.now()
                member.save(update_fields=['finished_at'])
                _assign_ranks(party)

        return Response({'verified': verified, 'already_done': False})


class LeavePartyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id == request.user.id:
            return Response({'detail': 'Host cannot leave. Delete the party instead.'}, status=400)
        PartyMember.objects.filter(party=party, user=request.user).delete()
        return Response(status=204)


class MyPartiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = PartyMember.objects.filter(user=request.user).select_related(
            'party__host').order_by('-party__created_at')[:10]
        parties = [m.party for m in memberships]
        return Response(PartySerializer(parties, many=True, context={'request': request}).data)
