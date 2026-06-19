// 例句数据 — 场景(大场景) → 具体情景(situation) → 例句
// 每个场景一个低饱和 hue 作为安静的色彩编码（同 L/C，仅变 hue）
window.SENT_SCENES = [
  {
    id: 1, name: "学校", en: "Campus", hue: 258,
    situations: [
      { name: "教室问候", items: [
        { ko: "선생님, 안녕하세요?", cn: "老师，您好？" },
        { ko: "오늘 수업은 몇 시에 시작해요?", cn: "今天的课几点开始？" },
      ]},
      { name: "借学习用品", items: [
        { ko: "연필을 빌려 주실 수 있어요?", cn: "可以借我一支铅笔吗？" },
        { ko: "지우개 좀 빌려도 될까요?", cn: "可以借一下橡皮吗？" },
      ]},
      { name: "提交作业", items: [
        { ko: "숙제는 어디에 내면 돼요?", cn: "作业交到哪里就可以？" },
        { ko: "내일까지 내도 돼요?", cn: "可以明天之前交吗？" },
      ]},
    ],
  },
  {
    id: 2, name: "医院", en: "Clinic", hue: 152,
    situations: [
      { name: "挂号", items: [
        { ko: "진료 예약을 하고 싶어요.", cn: "我想预约看诊。" },
        { ko: "처음 왔는데 어떻게 해야 돼요?", cn: "我第一次来，要怎么办？" },
      ]},
      { name: "描述症状", items: [
        { ko: "목이 아프고 열이 나요.", cn: "我嗓子疼，而且发烧。" },
        { ko: "어제부터 배가 아파요.", cn: "从昨天开始肚子疼。" },
      ]},
      { name: "取药", items: [
        { ko: "이 약은 하루에 몇 번 먹어요?", cn: "这个药一天吃几次？" },
        { ko: "식후에 먹으면 돼요?", cn: "饭后吃就可以吗？" },
      ]},
    ],
  },
  {
    id: 3, name: "交通", en: "Transit", hue: 205,
    situations: [
      { name: "问路", items: [
        { ko: "지하철역이 어디에 있어요?", cn: "地铁站在哪里？" },
        { ko: "여기서 멀어요?", cn: "离这里远吗？" },
      ]},
      { name: "买票", items: [
        { ko: "서울역까지 표 한 장 주세요.", cn: "请给我一张到首尔站的票。" },
        { ko: "왕복으로 주세요.", cn: "请给我往返票。" },
      ]},
      { name: "乘坐出租车", items: [
        { ko: "이 주소로 가 주세요.", cn: "请去这个地址。" },
        { ko: "여기서 세워 주세요.", cn: "请在这里停。" },
      ]},
    ],
  },
  {
    id: 4, name: "餐厅", en: "Dining", hue: 28,
    situations: [
      { name: "点餐", items: [
        { ko: "비빔밥 하나하고 물 한 잔 주세요.", cn: "请给我一份拌饭和一杯水。" },
        { ko: "메뉴 좀 추천해 주세요.", cn: "请推荐一下菜。" },
      ]},
      { name: "确认口味", items: [
        { ko: "맵지 않게 해 주세요.", cn: "请做得不要太辣。" },
        { ko: "이거 매워요?", cn: "这个辣吗？" },
      ]},
      { name: "结账", items: [
        { ko: "계산은 카드로 할게요.", cn: "我用卡结账。" },
        { ko: "따로 계산해 주세요.", cn: "请分开结账。" },
      ]},
    ],
  },
  {
    id: 5, name: "购物", en: "Shopping", hue: 320,
    situations: [
      { name: "询问价格", items: [
        { ko: "이거 얼마예요?", cn: "这个多少钱？" },
        { ko: "좀 깎아 주세요.", cn: "便宜点吧。" },
      ]},
      { name: "试穿", items: [
        { ko: "입어 봐도 돼요?", cn: "可以试穿一下吗？" },
        { ko: "더 큰 사이즈 있어요?", cn: "有更大的尺码吗？" },
      ]},
      { name: "退换", items: [
        { ko: "다른 색으로 바꿀 수 있어요?", cn: "可以换成别的颜色吗？" },
        { ko: "환불 받을 수 있어요?", cn: "可以退款吗？" },
      ]},
    ],
  },
  {
    id: 6, name: "住宿", en: "Stay", hue: 88,
    situations: [
      { name: "办理入住", items: [
        { ko: "예약한 방이 있어요.", cn: "我有预订的房间。" },
        { ko: "체크인하고 싶어요.", cn: "我想办理入住。" },
      ]},
      { name: "询问设施", items: [
        { ko: "와이파이 비밀번호가 뭐예요?", cn: "无线网络密码是什么？" },
        { ko: "아침 식사는 몇 시예요?", cn: "早餐几点？" },
      ]},
      { name: "请求帮助", items: [
        { ko: "수건을 하나 더 주세요.", cn: "请再给我一条毛巾。" },
        { ko: "방 청소를 부탁해요.", cn: "麻烦打扫一下房间。" },
      ]},
    ],
  },
];

// 给每个例句生成稳定 id：s{场景}-{情景序号}-{句序号}
window.SENT_SCENES.forEach((sc) => {
  sc.situations.forEach((sit, si) => {
    sit.items.forEach((it, ii) => {
      it.id = `s${sc.id}-${si}-${ii}`;
      it.sceneId = sc.id;
      it.sceneName = sc.name;
      it.situation = sit.name;
    });
  });
  sc.sentenceCount = sc.situations.reduce((n, s) => n + s.items.length, 0);
});
