export const TRANSLATIONS = {
  en: {
    appName: "⚔ Zero",
    tagline: "Pixiv Downloader & Manager",
    enterApp: "Tap to Enter",
    loading: "Loading 1DM downloader pipeline...",
    tabs: {
      downloads: "Downloads",
      browser: "Browser",
      settings: "Settings"
    },
    downloadTabs: {
      all: "All",
      active: "Active",
      queued: "Queued",
      completed: "Completed",
      failed: "Failed"
    },
    clipboard: {
      alertTitle: "Pixiv link detected",
      addButton: "Add to Queue",
      dismiss: "Dismiss",
      toastAdded: "Added Pixiv ID {id} to Download Queue"
    },
    browser: {
      placeholder: "Search Pixiv, artists, or enter Pixiv link...",
      searchButton: "Search",
      loginRequired: "Optional Pixiv Login",
      loginDesc: "Log in once to browse unrestricted artwork, or work anonymously without login.",
      username: "Username / Email",
      password: "Password",
      loginAction: "Login with Pixiv",
      logoutAction: "Logout",
      anonymous: "Continue Anonymously",
      chromeTranslate: "Translate this webpage to Arabic?",
      chromeTranslateActive: "Webpage Translated (Japanese ➜ Arabic)",
      translateBtn: "Translate Page",
      restoreBtn: "Show Original",
      tagsLabel: "Tags:",
      views: "Views",
      likes: "Likes",
      comments: "Comments",
      artistLatest: "Latest works by this artist",
      follow: "+ Follow Artist",
      following: "✓ Following Artist",
      downloadThis: "Download This Artwork",
      downloadThisManga: "Download Complete Manga Post",
      alreadyInQueue: "Already in Queue",
      noResults: "No simulated Pixiv results found."
    },
    downloadOpts: {
      immediately: "Download immediately (All pages)",
      displayFirst: "Display images before downloading",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      start: "Start Download ({count})",
      cancel: "Cancel",
      title: "Download Configuration"
    },
    manager: {
      importTxt: "Import TXT Links",
      exportTxt: "Export TXT Links",
      addUrl: "Add Single/Multiple URLs",
      urlInputPlaceholder: "Paste Pixiv URLs here (one per line)...",
      addBtn: "Add to Queue",
      noDownloads: "No download records in this section",
      queueStatus: "Queue",
      speed: "Speed",
      remaining: "Remaining",
      estimatedTime: "ETA",
      foregroundServiceActive: "ZeroForeground Downloader active",
      foregroundNotificationDesc: "Artwork ID {id} is downloading in background...",
      artworkId: "Artwork ID:",
      imagesCount: "Images:",
      size: "Size:",
      date: "Date:",
      actions: {
        openFolder: "Open Folder",
        compressZip: "Compress to ZIP",
        redownload: "Re-download",
        delete: "Delete",
        retry: "Retry / Resume",
        pause: "Pause"
      },
      duplicateDetected: "Duplicate protection: Link for ID {id} already exists."
    },
    settings: {
      langHeader: "Language Selection Selection & Translation Options",
      manualLang: "Manual Language",
      autoLang: "Auto Language Detection (Locale)",
      chromeTranslateService: "Built-in Screen Translation (Chrome style)",
      locationHeader: "Storage & File Directory Configuration",
      downloadLoc: "Download Destination Folder",
      zipMode: "Always Compress to ZIP on download end",
      behaviorHeader: "Speed & Queue Control Preferences",
      simDownloads: "Simultaneous Image Slots limit",
      autoRetry: "Auto Retry failed images (No network failbacks)",
      clipMonitor: "Interactive Clipboard Link Auto-Capture",
      dupProtection: "Duplicate Link Prevention Protection",
      bgHeader: "Personalisation & Background Wallpaper",
      selectBg: "Select Gallery Background Image",
      bgOpacity: "Background Wallpaper Tint Blend Intensity",
      restoreBg: "Reset Default Slate Color Layout"
    },
    folders: {
      title: "Local Storage Simulator - Zero/",
      empty: "This simulated storage folder is empty.",
      backBtn: "Back"
    }
  },
  
  ar: {
    appName: "⚔ زيرو",
    tagline: "تحميل وإدارة ملفات بيكسيف المتقدمة",
    enterApp: "انقر للدخول",
    loading: "تهيئة خط تحميل 1DM المتقدم...",
    tabs: {
      downloads: "التحميلات",
      browser: "المتصفح",
      settings: "الإعدادات"
    },
    downloadTabs: {
      all: "الكل",
      active: "النشطة",
      queued: "المجدولة",
      completed: "المكتملة",
      failed: "الفاشلة"
    },
    clipboard: {
      alertTitle: "تم اكتشاف رابط بيكسيف",
      addButton: "إضافة للمجدول",
      dismiss: "تجاهل",
      toastAdded: "تمت إضافة بيكسيف ID {id} إلى طابور التحميل"
    },
    browser: {
      placeholder: "ابحث عن بيكسيف، فنانين، أو الصق الرابط...",
      searchButton: "بحث",
      loginRequired: "تسجيل دخول بيكسيف (اختياري)",
      loginDesc: "سجل دخولك لتصفح الأعمال الفنية غير المقيدة، أو تابع الاستخدام المجهول للتصفح الفوري.",
      username: "اسم المستخدم / البريد الإلكتروني",
      password: "كلمة المرور",
      loginAction: "تسجيل الدخول عبر Pixiv",
      logoutAction: "تسجيل الخروج",
      anonymous: "متابعة كمجهول",
      chromeTranslate: "ترجمة هذه الصفحة إلى العربية الآن؟",
      chromeTranslateActive: "تمت ترجمة الصفحة بنجاح (ياباني ➜ عربي)",
      translateBtn: "ترجمة الصفحة",
      restoreBtn: "عرض الأصل",
      tagsLabel: "الوسوم الأصلية:",
      views: "المشاهدات",
      likes: "الإعجابات",
      comments: "التعليقات",
      artistLatest: "آخر أعمال هذا الفنان الرائجة",
      follow: "+ متابعة الرسام",
      following: "✓ متابع",
      downloadThis: "تحميل هذا العمل الفني",
      downloadThisManga: "تحميل ألبوم المانجا كاملاً",
      alreadyInQueue: "موجود بالفعل في قائمة الانتظار",
      noResults: "لم يتم العثور على نتائج بيكسيف مطابقة."
    },
    downloadOpts: {
      immediately: "تحميل جميع الصور فوراً",
      displayFirst: "عرض واختيار الصور قبل التحميل",
      selectAll: "تحديد الكل",
      deselectAll: "إلغاء تحديد الكل",
      start: "بدء التحميل ({count} صور)",
      cancel: "إلغاء",
      title: "خيارات تهيئة التنزيل"
    },
    manager: {
      importTxt: "استيراد TXT",
      exportTxt: "تصدير المفكرة TXT",
      addUrl: "إضافة رابط واحد أو متعدد",
      urlInputPlaceholder: "الصق روابط بيكسيف هنا (رابط واحد لكل سطر)...",
      addBtn: "إضافة لقائمة الانتظار",
      noDownloads: "لا توجد سجلات تحميل في هذا القسم حالياً",
      queueStatus: "في الطابور",
      speed: "السرعة",
      remaining: "المتبقي",
      estimatedTime: "الزمن المقدر",
      foregroundServiceActive: "خدمة زيرو النشطة في الخلفية",
      foregroundNotificationDesc: "العمل الفني ذو الرقم {id} يتم تحميله الآن في الخلفية...",
      artworkId: "رقم العمل الفني:",
      imagesCount: "عدد الصور:",
      size: "الحجم:",
      date: "التاريخ:",
      actions: {
        openFolder: "فتح المجلد",
        compressZip: "ضغط إلى ZIP",
        redownload: "إعادة تحميل",
        delete: "إزالة",
        retry: "استئناف / إعادة",
        pause: "إيقاف مؤقت"
      },
      duplicateDetected: "حماية التكرار: الرابط الخاص بالمعرف {id} موجود بالفعل."
    },
    settings: {
      langHeader: "إعدادات اللغة المفضلة وترجمة الشاشة",
      manualLang: "لغة التطبيق اليدوية",
      autoLang: "اكتشاف اللغة تلقائياً (حسب لغة الهاتف)",
      chromeTranslateService: "نظام الترجمة الداخلي الفوري (نمط كروم غوغل)",
      locationHeader: "إعدادات مسار التنزيل وبنية الملفات",
      downloadLoc: "مسار التنزيل الافتراضي في الجهاز",
      zipMode: "ضغط العمل الفني المكتمل إلى ZIP تلقائياً",
      behaviorHeader: "السرعات وطابور جدولة التحميلات",
      simDownloads: "عدد الصور المحملة بشكل متزامن",
      autoRetry: "إعادة محاولة تحميل الصور التالفة تلقائياً",
      clipMonitor: "رصد وروابط الحافظة التلقائي الفوري",
      dupProtection: "منع الروابط المكررة في طابور التحميل",
      bgHeader: "تخصيص الواجهة وخلفيات الهاتف",
      selectBg: "اختر صورة خلفية من معرض الهاتف",
      bgOpacity: "درجة دمج وتعتيم شفافية الخلفية",
      restoreBg: "استعادة المظهر الحجري الافتراضي"
    },
    folders: {
      title: "محاكي وحدة خزن الهاتف - Zero/",
      empty: "مجلد تحميل زيرو فارغ حالياً.",
      backBtn: "رجوع"
    }
  }
};
