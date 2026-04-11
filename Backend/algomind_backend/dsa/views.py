from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Problem, Tag, Submission
from .serializers import (ProblemListSerializer, ProblemDetailSerializer,
                           SubmissionSerializer, SubmissionCreateSerializer, TagSerializer)
from .filters import ProblemFilter


DIFFICULTY_POINTS = {'easy': 10, 'medium': 25, 'hard': 50}


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
