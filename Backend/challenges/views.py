"""
Challenges views — Friends Code Party.
"""
import requests
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import PlatformProfile
from .models import Party, PartyMember, PartyQuestion, QuestionCompletion, PartyStrikeLog
from .serializers import (
    PartySerializer, CreatePartySerializer, AddQuestionSerializer,
)
from .problem_pool import shuffle_for_party, ALL_TOPIC_NAMES

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
            'members__user',
            'members__user__platform_profiles',
            'members__completions__question',
            'members__strike_logs',
            'questions'
        ).get(code=code.upper()), None
    except Party.DoesNotExist:
        return None, Response({'detail': 'Party not found.'}, status=status.HTTP_404_NOT_FOUND)


def _assign_ranks(party):
    completed = list(party.members.filter(finished_at__isnull=False, is_disqualified=False).order_by('finished_at'))
    disqualified = list(party.members.filter(is_disqualified=True).order_by('finished_at'))
    total = party.members.filter(is_spectator=False).count()

    current_rank = 1
    for m in completed:
        if m.rank != current_rank:
            m.rank = current_rank
            m.save(update_fields=['rank'])
        # Award contest win rating for ranked parties
        if party.is_ranked and not m.is_spectator:
            m.user.award_contest_win(rank=current_rank, total_participants=total)
        current_rank += 1

    for m in disqualified:
        m.rank = None
        m.save(update_fields=['rank'])


# ── Views ─────────────────────────────────────────────────────────────

class CreatePartyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = CreatePartySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        party = Party.objects.create(
            host=request.user,
            name=d['name'],
            duration_minutes=d['duration_minutes'],
            max_questions=d['max_questions'],
            question_mode=d['question_mode'],
            is_ranked=d.get('is_ranked', False),
            max_strikes=d.get('max_strikes', 3),
            host_spectator=d.get('host_spectator', False),
            match_type=d.get('match_type', 'standard'),
            versus_mode=d.get('versus_mode', 'competitive'),
            versus_topic=d.get('versus_topic', ''),
            versus_selection=d.get('versus_selection', 'topic'),
            versus_q_data=d.get('versus_q_data', {}),
        )
        PartyMember.objects.create(
            party=party,
            user=request.user,
            is_spectator=d.get('host_spectator', False),
        )
        return Response(PartySerializer(party, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class JoinPartyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.status != 'waiting':
            return Response({'detail': 'Party already started or finished.'}, status=400)
        if party.match_type == 'versus':
            if party.members.count() >= 2 and not party.members.filter(user=request.user).exists():
                return Response({'detail': 'This 1v1 Versus room is already full (2/2 players).'}, status=400)
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
        if party.match_type == 'versus':
            if party.members.count() < 2:
                return Response({'detail': '1v1 Versus requires 2 players. Invite an opponent first.'}, status=400)
            if not party.versus_q_data:
                return Response({'detail': 'No question configured for this Versus match.'}, status=400)
        else:
            if party.questions.count() == 0:
                return Response({'detail': 'Add at least one question before starting.'}, status=400)
        if party.duration_minutes <= 0:
            return Response({'detail': 'Cannot start match: Duration must be greater than 0 minutes.'}, status=400)
        if party.match_type != 'versus' and party.max_strikes <= 0:
            return Response({'detail': 'Cannot start match: Allowed strikes must be greater than 0.'}, status=400)
        now = timezone.now()
        party.status = 'active'
        party.started_at = now
        party.ends_at = now + timezone.timedelta(minutes=party.duration_minutes)
        party.save(update_fields=['status', 'started_at', 'ends_at'])
        # If host chose spectator mode, mark their membership as spectator
        # so they are excluded from leaderboard and don't need to solve problems
        if party.host_spectator:
            try:
                host_member = party.members.get(user=request.user)
                host_member.is_spectator = True
                host_member.finished_at = now   # Exclude from ranking immediately
                host_member.save(update_fields=['is_spectator', 'finished_at'])
            except PartyMember.DoesNotExist:
                pass
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
            # ── Award rating points for solving the question from platform (easy: 5, medium: 6, hard: 7) ────
            pts = request.user.award_question_rating(question.difficulty, from_platform=True)
            # ────────────────────────────────────────────────────────────
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


class EndPartyView(APIView):
    """Host can force-end the party."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can end the party.'}, status=403)
        if party.status == 'finished':
            return Response({'detail': 'Party already finished.'}, status=400)
        party.status = 'finished'
        party.save(update_fields=['status'])
        _assign_ranks(party)
        return Response(PartySerializer(party, context={'request': request}).data)


class ForfeitPartyView(APIView):
    """Participant forfeits (marks finished_at so they get a rank but DNF)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.status != 'active':
            return Response({'detail': 'Party is not active.'}, status=400)
        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Not a member.'}, status=404)
        if not member.finished_at:
            member.finished_at = timezone.now()
            member.save(update_fields=['finished_at'])
            _assign_ranks(party)
        return Response({'detail': 'Forfeited.'})


class KickMemberView(APIView):
    """Host can kick a participant."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, code, member_id):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can kick members.'}, status=403)
        try:
            member = party.members.get(id=member_id)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=404)
        if member.user_id == party.host_id:
            return Response({'detail': 'Cannot kick yourself.'}, status=400)
        member.delete()
        return Response(status=204)


class RenamePartyView(APIView):
    """Host can rename the party or update configuration (duration, strikes) before start."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can modify settings.'}, status=403)
        if party.status != 'waiting':
            return Response({'detail': 'Cannot modify after start.'}, status=400)

        update_fields = []
        if 'name' in request.data:
            name = str(request.data['name']).strip()
            if name:
                party.name = name[:100]
                update_fields.append('name')
        if 'duration_minutes' in request.data:
            party.duration_minutes = max(0, min(360, int(request.data['duration_minutes'])))
            update_fields.append('duration_minutes')
        if 'max_strikes' in request.data:
            party.max_strikes = max(0, min(50, int(request.data['max_strikes'])))
            update_fields.append('max_strikes')
        if 'versus_q_data' in request.data:
            party.versus_q_data = request.data['versus_q_data']
            update_fields.append('versus_q_data')
        if 'versus_mode' in request.data:
            party.versus_mode = str(request.data['versus_mode'])
            update_fields.append('versus_mode')
        if 'versus_topic' in request.data:
            party.versus_topic = str(request.data['versus_topic'])
            update_fields.append('versus_topic')
        if 'versus_selection' in request.data:
            party.versus_selection = str(request.data['versus_selection'])
            update_fields.append('versus_selection')

        if update_fields:
            party.save(update_fields=update_fields)
        return Response(PartySerializer(party, context={'request': request}).data)


class InviteFriendView(APIView):
    """Host sends an invite notification to a friend."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        from users.models import Notification
        from friends.models import Friendship
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can invite.'}, status=403)
        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response({'detail': 'receiver_id required.'}, status=400)
        User = party.host.__class__
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        # Create invite notification
        join_url = f"/challenges?join={party.code}"
        Notification.objects.create(
            recipient=receiver,
            notif_type='system',
            title=f'{request.user.username} invited you',
            body=f'Join "{party.name}" — code: {party.code}',
            related_id=party.id,
            avatar_text=request.user.username[:2].upper(),
            color='#6366F1',
        )
        return Response({'detail': 'Invite sent.', 'join_url': join_url})


_CF_PROBLEMS_CACHE = {'timestamp': 0, 'data': {}}

def _get_cf_problems_map():
    import time
    now = time.time()
    # Cache for 2 hours
    if _CF_PROBLEMS_CACHE['data'] and (now - _CF_PROBLEMS_CACHE['timestamp']) < 7200:
        return _CF_PROBLEMS_CACHE['data']
    try:
        r = requests.get('https://codeforces.com/api/problemset.problems', timeout=15)
        if r.status_code == 200:
            res = r.json()
            if res.get('status') == 'OK':
                pmap = {}
                for p in res.get('result', {}).get('problems', []):
                    c_id = str(p.get('contestId', ''))
                    idx = str(p.get('index', '')).upper()
                    key = f"{c_id}{idx}".lower()
                    dash_key = f"{c_id}-{idx}".lower()
                    pmap[key] = p
                    pmap[dash_key] = p
                _CF_PROBLEMS_CACHE['data'] = pmap
                _CF_PROBLEMS_CACHE['timestamp'] = now
                return pmap
    except Exception:
        pass
    return _CF_PROBLEMS_CACHE.get('data', {})


class LeetCodeProblemLookupView(APIView):
    """Given a LeetCode problem number or slug, fetch title/slug/difficulty via GraphQL."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, number):
        query = '''
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(
            categorySlug: $categorySlug
            limit: $limit
            skip: $skip
            filters: $filters
          ) {
            questions: data {
              frontendQuestionId: questionFrontendId
              title
              titleSlug
              difficulty
            }
          }
        }'''
        try:
            r = requests.post(
                LEETCODE_GQL,
                json={
                    'query': query,
                    'variables': {
                        'categorySlug': '',
                        'skip': 0,
                        'limit': 50,
                        'filters': {'searchKeywords': str(number)}
                    }
                },
                headers=LC_HEADERS, timeout=12,
            )
            questions = r.json().get('data', {}).get('problemsetQuestionList', {}).get('questions', [])
            target_str = str(number).strip()
            # 1. Exact match on frontendQuestionId
            for q in questions:
                if str(q.get('frontendQuestionId')).strip() == target_str:
                    slug = q['titleSlug']
                    diff = q['difficulty'].lower()
                    return Response({
                        'title': q['title'],
                        'slug': slug,
                        'difficulty': diff,
                        'url': f'https://leetcode.com/problems/{slug}/',
                        'platform': 'leetcode',
                        'frontend_id': q.get('frontendQuestionId'),
                    })
            # 2. Match on titleSlug
            for q in questions:
                if q.get('titleSlug') == target_str.lower():
                    diff = q['difficulty'].lower()
                    return Response({
                        'title': q['title'],
                        'slug': q['titleSlug'],
                        'difficulty': diff,
                        'url': f'https://leetcode.com/problems/{q["titleSlug"]}/',
                        'platform': 'leetcode',
                        'frontend_id': q.get('frontendQuestionId'),
                    })
            # 3. If only one question returned, return it
            if len(questions) == 1:
                q = questions[0]
                diff = q['difficulty'].lower()
                return Response({
                    'title': q['title'],
                    'slug': q['titleSlug'],
                    'difficulty': diff,
                    'url': f'https://leetcode.com/problems/{q["titleSlug"]}/',
                    'platform': 'leetcode',
                    'frontend_id': q.get('frontendQuestionId'),
                })
            return Response({'detail': f'Problem #{number} not found.'}, status=404)
        except Exception as e:
            return Response({'detail': f'LeetCode API error: {e}'}, status=502)


class CodeforcesProblemLookupView(APIView):
    """Given a Codeforces problem query (e.g. '158A', '158-A', '4A', or URL), fetch metadata."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, query):
        q = str(query).strip()
        import re
        url_match = re.search(r'codeforces\.com/(?:problemset/problem|contest)/(\d+)/(?:problem/)?([A-Za-z0-9]+)', q)
        if url_match:
            contest_id = url_match.group(1)
            index = url_match.group(2).upper()
        else:
            match = re.match(r'^(\d+)[-_]?([A-Za-z0-9]+)$', q)
            if not match:
                return Response({'detail': 'Invalid Codeforces problem format. Use e.g. 158A or problem URL.'}, status=400)
            contest_id = match.group(1)
            index = match.group(2).upper()

        pmap = _get_cf_problems_map()
        lookup_key = f"{contest_id}{index}".lower()
        prob = pmap.get(lookup_key)

        if prob:
            name = prob.get('name', f'Problem {contest_id}{index}')
            rating = prob.get('rating')
            if rating is None:
                diff = 'medium'
            elif rating < 1400:
                diff = 'easy'
            elif rating < 1900:
                diff = 'medium'
            else:
                diff = 'hard'

            slug = f"{contest_id}-{index}"
            return Response({
                'title': f"{contest_id}{index} - {name}",
                'slug': slug,
                'difficulty': diff,
                'url': f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
                'platform': 'codeforces',
                'rating': rating,
            })

        return Response({
            'title': f"Codeforces {contest_id}{index}",
            'slug': f"{contest_id}-{index}",
            'difficulty': 'medium',
            'url': f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
            'platform': 'codeforces',
        })


class TopicListView(APIView):
    """Returns the list of all selectable topics for shuffle filter."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'topics': ALL_TOPIC_NAMES})


class ShuffleWithFilterView(APIView):
    """AI shuffle with topic + difficulty filters."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.host_id != request.user.id:
            return Response({'detail': 'Only the host can shuffle.'}, status=403)
        if party.status != 'waiting':
            return Response({'detail': 'Cannot modify after start.'}, status=400)

        topics      = request.data.get('topics', [])       # list of topic slugs
        difficulties = request.data.get('difficulties', []) # list: easy/medium/hard

        solved: set = set()
        for m in party.members.select_related('user'):
            for profile in PlatformProfile.objects.filter(user=m.user):
                if profile.platform_name == 'leetcode' and profile.handle:
                    solved.update(_lc_accepted_slugs(profile.handle))
                elif profile.platform_name == 'codeforces' and profile.handle:
                    solved.update(_cf_accepted_slugs(profile.handle))

        chosen = shuffle_for_party(
            solved, count=party.max_questions,
            topics=topics or None,
            difficulties=difficulties or None,
        )
        party.questions.all().delete()
        for i, (title, slug, platform, url, diff) in enumerate(chosen):
            PartyQuestion.objects.create(
                party=party, title=title, slug=slug,
                platform=platform, url=url, difficulty=diff, order=i,
            )
        return Response(PartySerializer(party, context={'request': request}).data)


class ReportStrikeView(APIView):
    """
    POST /challenges/party/<code>/strike/
    Body: { "reason": "..." }

    Called by the frontend when the extension reports a violation.
    Persists the strike count and reason to DB. Auto-disqualifies when strikes >= party.max_strikes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.status != 'active':
            return Response({'detail': 'Party is not active.'}, status=400)
        if not party.is_ranked:
            return Response({'detail': 'Strike reporting only for ranked parties.'}, status=400)

        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Not a member.'}, status=404)

        if member.finished_at:
            return Response({'detail': 'Already finished.'}, status=400)

        reason = request.data.get('reason', 'Fair play violation')

        # Increment strikes in DB — cap at max_strikes to prevent race conditions
        member.strikes = min(member.strikes + 1, party.max_strikes)
        member.save(update_fields=['strikes'])

        # Record strike audit log
        PartyStrikeLog.objects.create(
            party=party,
            member=member,
            strike_number=member.strikes,
            reason=reason
        )

        # Auto-disqualify if threshold reached
        if member.strikes >= party.max_strikes:
            member.finished_at = timezone.now()
            member.is_disqualified = True
            member.disqualified_reason = f'Strike limit exceeded: {reason}'
            member.save(update_fields=['finished_at', 'is_disqualified', 'disqualified_reason'])
            _assign_ranks(party)
            return Response({
                'strikes': member.strikes,
                'forfeited': True,
                'is_disqualified': True,
                'detail': f'Auto-disqualified: {reason}',
                'party': PartySerializer(party, context={'request': request}).data,
            })

        return Response({
            'strikes': member.strikes,
            'forfeited': False,
            'max_strikes': party.max_strikes,
            'remaining': party.max_strikes - member.strikes,
            'party': PartySerializer(party, context={'request': request}).data,
        })


class HostDisqualifyMemberView(APIView):
    """
    POST /challenges/party/<code>/disqualify/
    Body: { "member_id": 123, "reason": "Host moderation" }
    Host makes a participant OUT (same effect as hitting strike limit).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err

        if party.host_id != request.user.id and not request.user.is_staff:
            return Response({'detail': 'Only the host can disqualify competitors.'}, status=403)

        member_id = request.data.get('member_id')
        if not member_id:
            return Response({'detail': 'member_id is required.'}, status=400)

        try:
            member = party.members.get(id=member_id)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=404)

        if member.user_id == party.host_id:
            return Response({'detail': 'Cannot disqualify the host.'}, status=400)

        reason = request.data.get('reason', 'Disqualified by host')
        member.is_disqualified = True
        member.disqualified_reason = reason
        member.finished_at = timezone.now()
        member.strikes = party.max_strikes  # Mark strike limit reached
        member.save(update_fields=['is_disqualified', 'disqualified_reason', 'finished_at', 'strikes'])

        PartyStrikeLog.objects.create(
            party=party,
            member=member,
            strike_number=party.max_strikes,
            reason=f"Host Disqualification: {reason}",
        )

        _assign_ranks(party)

        return Response({
            'detail': f'Member {member.user.username} has been disqualified and made OUT.',
            'party': PartySerializer(party, context={'request': request}).data
        })


class ReportActiveQuestionView(APIView):
    """
    POST /challenges/party/<code>/active-question/
    Body: { "slug": "two-sum", "title": "Two Sum" }
    Tracks which question each participant is actively working on.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err

        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Not a member.'}, status=404)

        title = request.data.get('title', '')
        slug = request.data.get('slug', '')
        if title:
            member.current_question_title = title[:300]
        if slug:
            member.current_question_slug = slug[:300]
        member.save(update_fields=['current_question_title', 'current_question_slug'])

        return Response({'status': 'ok'})

        return Response({
            'strikes': member.strikes,
            'forfeited': False,
            'max_strikes': party.max_strikes,
            'remaining': party.max_strikes - member.strikes,
            'party': PartySerializer(party, context={'request': request}).data,
        })


class ExtensionPulseView(APIView):

    """
    POST /challenges/party/<code>/pulse/

    Called by the React frontend every 5 seconds when a ranked challenge
    is active and the AlgoMind extension is running.  Marks the member's
    last_pulse timestamp in memory (stored on PartyMember via cache-key).

    If the backend does NOT receive a pulse for > 15 seconds it means the
    extension was disabled mid-challenge → register a violation strike.

    Response:
      { "alive": true }       — pulse accepted, challenge still active
      { "alive": false }      — challenge ended or member already finished
    """
    permission_classes = [permissions.IsAuthenticated]

    PULSE_TTL_SECONDS = 15   # If no pulse in 15 s → extension is off

    def post(self, request, code):
        from django.core.cache import cache

        party, err = _get_party_or_404(code)
        if err: return err

        if party.status != 'active':
            return Response({'alive': False})

        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Not a member.'}, status=404)

        if member.finished_at:
            return Response({'alive': False})

        cache_key = f'algomind_pulse_{party.code}_{request.user.id}'
        cache.set(cache_key, timezone.now().isoformat(), timeout=self.PULSE_TTL_SECONDS)

        return Response({'alive': True})

    def get(self, request, code):
        """
        GET /challenges/party/<code>/pulse/
        Called by background monitoring to check if a member's extension
        has gone silent.  Returns is_alive per member.
        Host-only.  Used for server-side enforcement in the future.
        """
        from django.core.cache import cache

        party, err = _get_party_or_404(code)
        if err: return err

        if party.host != request.user:
            return Response({'detail': 'Forbidden'}, status=403)

        results = []
        for member in party.members.filter(finished_at__isnull=True):
            cache_key = f'algomind_pulse_{party.code}_{member.user_id}'
            last = cache.get(cache_key)
            results.append({
                'username': member.user.username,
                'is_alive': last is not None,
                'last_pulse': last,
            })

        return Response({'members': results})


class VersusSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        if party.status != 'active':
            return Response({'detail': 'Match is not active.'}, status=400)
        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'You are not in this match.'}, status=403)

        passed = request.data.get('passed', False)
        if not passed:
            return Response({'detail': 'Solution did not pass all test cases.'}, status=400)

        now = timezone.now()
        if not member.finished_at:
            member.finished_at = now
            # First one to finish gets rank 1
            has_first = party.members.filter(rank=1).exists()
            member.rank = 2 if has_first else 1
            member.save(update_fields=['finished_at', 'rank'])

            if member.rank == 1 and party.versus_mode == 'competitive':
                diff = party.versus_q_data.get('diff', 'medium')
                request.user.award_question_rating(diff)

            # Check if all competitors finished
            all_done = not party.members.filter(finished_at__isnull=True).exists()
            if all_done:
                party.status = 'finished'
                party.save(update_fields=['status'])

        return Response(PartySerializer(party, context={'request': request}).data)


class VersusHintFoulView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Not a member.'}, status=403)

        hint_idx = request.data.get('hint_index', 0)
        penalty = request.data.get('penalty_seconds', 180) # +3 min default penalty
        member.hints_used += 1
        member.hint_fouls_seconds += penalty
        member.save(update_fields=['hints_used', 'hint_fouls_seconds'])

        PartyStrikeLog.objects.create(
            party=party,
            member=member,
            strike_number=member.hints_used,
            reason=f'Hint #{hint_idx + 1} taken (+{penalty // 60}m time penalty)'
        )
        return Response(PartySerializer(party, context={'request': request}).data)


class VersusGiveUpView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        party, err = _get_party_or_404(code)
        if err: return err
        try:
            member = party.members.get(user=request.user)
        except PartyMember.DoesNotExist:
            return Response({'detail': 'Not a member.'}, status=403)

        now = timezone.now()
        member.gave_up = True
        member.finished_at = now
        member.rank = 2
        member.save(update_fields=['gave_up', 'finished_at', 'rank'])

        # Opponent gets rank 1 if they haven't finished
        opponents = party.members.exclude(id=member.id)
        for opp in opponents:
            if not opp.rank:
                opp.rank = 1
                opp.save(update_fields=['rank'])

        return Response(PartySerializer(party, context={'request': request}).data)


