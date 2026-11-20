import base64
import binascii
import time

import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from users.throttles import CodeExecThrottle
from .models import Problem, Tag, Submission
from .serializers import (ProblemListSerializer, ProblemDetailSerializer,
                           SubmissionSerializer, SubmissionCreateSerializer,
                           TagSerializer, CodeExecutionSerializer)
from .filters import ProblemFilter


DIFFICULTY_POINTS = {'easy': 3, 'medium': 4, 'hard': 5}
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
            # Check for resubmission of an already accepted problem
            prior_accepted = Submission.objects.filter(
                user=request.user,
                problem=submission.problem,
                status='accepted'
            ).exclude(id=submission.id).exists()

            if not prior_accepted:
                # 3 points for easy, 4 for medium, 5 for hard
                difficulty = (submission.problem.difficulty or 'easy').lower()
                request.user.award_question_rating(difficulty, from_platform=False)

        return Response(
            SubmissionSerializer(submission).data,
            status=status.HTTP_201_CREATED
        )


from .runner import execute_code


class ExecuteCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [CodeExecThrottle]

    def post(self, request):
        serializer = CodeExecutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']
        stdin = serializer.validated_data.get('stdin', '')
        language = serializer.validated_data.get('language', 'cpp')
        schema = serializer.validated_data.get('schema', '')

        # In-Place multi-language execution engine (C++, Python, Java, JS, SQL, LLD)
        result = execute_code(language=language, code=code, stdin=stdin, schema=schema)
        return Response(result)


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
