from django.urls import path
from .views import (TagListView, ProblemListView, ProblemDetailView,
                    SubmitView, SubmissionListView, ProblemSubmissionsView)

urlpatterns = [
    path('tags/',                       TagListView.as_view(),              name='tag_list'),
    path('problems/',                   ProblemListView.as_view(),           name='problem_list'),
    path('problems/<int:id>/',          ProblemDetailView.as_view(),         name='problem_detail'),
    path('submit/',                     SubmitView.as_view(),                name='submit'),
    path('submissions/',                SubmissionListView.as_view(),        name='submission_list'),
    path('submissions/problem/<int:id>/', ProblemSubmissionsView.as_view(), name='problem_submissions'),
]
