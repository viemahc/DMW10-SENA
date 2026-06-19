from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SenaRecordViewSet, EmailClientViewSet, EmailRespondentViewSet, SenaMinutesViewSet, SenaAppointmentViewSet, AgencyRecordViewSet

router = DefaultRouter()
router.register(r'records', SenaRecordViewSet, basename='sena-record')
router.register(r'email-clients', EmailClientViewSet, basename='email-client')
router.register(r'email-respondents', EmailRespondentViewSet, basename='email-respondent')
router.register(r'minutes', SenaMinutesViewSet, basename='sena-minutes')
router.register(r'appointments', SenaAppointmentViewSet, basename='sena-appointment')
router.register(r'agency-records', AgencyRecordViewSet, basename='agency-record')

urlpatterns = [
    path('', include(router.urls)),
]
