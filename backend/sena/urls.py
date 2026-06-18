from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SenaRecordViewSet

router = DefaultRouter()
router.register(r'records', SenaRecordViewSet, basename='sena-record')

urlpatterns = [
    path('', include(router.urls)),
]
