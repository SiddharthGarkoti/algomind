import base64
import binascii
import time

import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Problem, Tag, Submission
from .serializers import (ProblemListSerializer, ProblemDetailSerializer,
                           SubmissionSerializer, SubmissionCreateSerializer,
                           TagSerializer, CodeExecutionSerializer)
from .filters import ProblemFilter


DIFFICULTY_POINTS = {'easy': 10, 'medium': 25, 'hard': 50}
JUDGE0_FINAL_STATUS_IDS = {3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}


def _judge0_headers():
    headers = {'Content-Type': 'application/json'}
    if settings.JUDGE0_AUTH_TOKEN:
        headers['X-Auth-Token'] = settings.JUDGE0_AUTH_TOKEN
    return headers


def _encode_b64(text: str) -> str:
    return base64.b64encode((text or '').encode('utf-8')).decode('ascii')


def _decode_b64(value):
    if not value:
        return ''
    try:
        return base64.b64decode(value).decode('utf-8', errors='replace')
    except (ValueError, binascii.Error):
        return value


def _format_execution_result(result: dict) -> dict:
    status_info = result.get('status') or {}
    status_id = status_info.get('id')
    status_desc = status_info.get('description') or ''

    stdout = _decode_b64(result.get('stdout'))
    stderr = _decode_b64(result.get('stderr'))
    compile_output = _decode_b64(result.get('compile_output'))
    message = _decode_b64(result.get('message'))

    success = status_id == 3
    success_output = (stdout or 'Success (no output)').strip()
    error_output = (compile_output or stderr or message or status_desc or 'Execution failed').strip()

    return {
        'status': '0' if success else str(status_id or 1),
        'program_output': stdout,
        'program_message': success_output if success else '',
        'compiler_error': error_output if not success else '',
        'compiler_message': status_desc,
        'output': success_output if success else error_output,
        'time': result.get('time'),
        'memory': result.get('memory'),
    }


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProblemListView(generics.ListAPIView):
    serializer_class   = ProblemListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class    = ProblemFilter
    search_fields      = ['title', 'tags__name']
    ordering_fields    = ['difficulty', 'created_at']

    def get_queryset(self):
        return Problem.objects.filter(is_active=True).prefetch_related('tags')


class ProblemDetailView(generics.RetrieveAPIView):
    queryset           = Problem.objects.filter(is_active=True).prefetch_related('tags')
    serializer_class   = ProblemDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field       = 'id'


class SubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save(user=request.user)

        if submission.status == 'accepted':
            points = DIFFICULTY_POINTS.get(submission.problem.difficulty, 10)
            request.user.award_rating(points)

        return Response(
            SubmissionSerializer(submission).data,
            status=status.HTTP_201_CREATED
        )


class ExecuteCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CodeExecutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = {
            'language_id': settings.JUDGE0_CPP_LANGUAGE_ID,
            'source_code': _encode_b64(serializer.validated_data['code']),
            'stdin': _encode_b64(serializer.validated_data.get('stdin', '')),
        }
        base_url = settings.JUDGE0_BASE_URL.rstrip('/')
        fields = 'stdout,stderr,compile_output,message,status,time,memory'

        try:
            create_response = requests.post(
                f'{base_url}/submissions/',
                params={'base64_encoded': 'true', 'wait': 'false'},
                json=payload,
                headers=_judge0_headers(),
                timeout=settings.JUDGE0_REQUEST_TIMEOUT,
            )
            create_body = create_response.json()
            if not create_response.ok:
                detail = create_body.get('error') or create_body.get('detail') or f'HTTP {create_response.status_code}'
                return Response(
                    {'detail': f'Compiler service rejected the request: {detail}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            token = create_body.get('token')
            if not token:
                return Response(
                    {'detail': 'Compiler service did not return a submission token.'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            result = None
            for attempt in range(settings.JUDGE0_POLL_ATTEMPTS):
                if attempt:
                    time.sleep(settings.JUDGE0_POLL_INTERVAL)

                result_response = requests.get(
                    f'{base_url}/submissions/{token}',
                    params={'base64_encoded': 'true', 'fields': fields},
                    headers=_judge0_headers(),
                    timeout=settings.JUDGE0_REQUEST_TIMEOUT,
                )
                result_body = result_response.json()

                if result_response.ok:
                    status_id = (result_body.get('status') or {}).get('id')
                    if status_id in JUDGE0_FINAL_STATUS_IDS:
                        result = result_body
                        break
                    continue

                pending_error = (result_body.get('error') or '').lower()
                if result_response.status_code == 400 and ('status is 1' in pending_error or 'status is 2' in pending_error):
                    continue

                detail = result_body.get('error') or result_body.get('detail') or f'HTTP {result_response.status_code}'
                return Response(
                    {'detail': f'Compiler service returned an unexpected response: {detail}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            if result is None:
                return Response(
                    {'detail': 'Compiler service timed out while waiting for execution.'},
                    status=status.HTTP_504_GATEWAY_TIMEOUT,
                )

            return Response(_format_execution_result(result))

        except requests.Timeout:
            return Response(
                {'detail': 'Compiler service request timed out.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except requests.RequestException as exc:
            return Response(
                {'detail': f'Compiler service request failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError:
            return Response(
                {'detail': 'Compiler service returned invalid JSON.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class SubmissionListView(generics.ListAPIView):
    serializer_class   = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (Submission.objects
                .filter(user=self.request.user)
                .select_related('problem'))


class ProblemSubmissionsView(generics.ListAPIView):
    serializer_class   = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (Submission.objects
                .filter(user=self.request.user, problem_id=self.kwargs['id'])
                .select_related('problem'))
