# Page snapshot

```yaml
- generic [ref=e4]:
  - button "Switch to English" [ref=e6] [cursor=pointer]: English
  - generic [ref=e7]:
    - heading "مرحباً بكم في نظام إدارة الحضانات" [level=1] [ref=e8]
    - paragraph [ref=e9]: سجل الدخول للمتابعة باستخدام كلمة المرور أو رمز التحقق عبر البريد الإلكتروني
  - form "نموذج تسجيل الدخول" [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: البريد الإلكتروني
        - textbox "حقل البريد الإلكتروني" [ref=e14]:
          - /placeholder: example@email.com
          - text: admin@nursery.local
        - paragraph [ref=e15]: أدخل بريدك الإلكتروني المسجل في النظام
      - generic [ref=e16]:
        - generic [ref=e17]: كلمة المرور
        - textbox "حقل كلمة المرور" [ref=e18]:
          - /placeholder: ••••••••
          - text: Admin123!
    - alert "رسالة خطأ" [ref=e19]:
      - generic [ref=e20]:
        - img [ref=e21]
        - paragraph [ref=e24]: فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت. (http://localhost:4173)
    - button "زر إرسال النموذج" [ref=e25] [cursor=pointer]:
      - generic [ref=e26]: تسجيل الدخول
```