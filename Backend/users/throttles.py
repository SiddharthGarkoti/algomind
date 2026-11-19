from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class OTPThrottle(UserRateThrottle):
    scope = 'otp'


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class CodeExecThrottle(UserRateThrottle):
    scope = 'exec'


class AIThrottle(UserRateThrottle):
    scope = 'ai'
