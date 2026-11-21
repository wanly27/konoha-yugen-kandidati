(() => {
  const cfg = window.ELECTION_CONFIG || {};
  const form = document.getElementById("nominationForm");
  const status = document.getElementById("status");
  const button = document.getElementById("submitBtn");
  const speechInput = document.getElementById("speech");
  const charCount = document.getElementById("charCount");

  function updateCounter() {
    charCount.textContent = `${speechInput.value.length} / 1500`;
  }
  speechInput.addEventListener("input", updateCounter);
  updateCounter();

  function show(message, type) {
    status.textContent = message;
    status.className = "status " + (type || "");
  }

  function isValidSteamId(value) {
    return /^(STEAM_[0-5]:[01]:[0-9]{1,12}|7656119[0-9]{10})$/i.test(value);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    show("", "");

    const nickname = document.getElementById("nickname").value.trim();
    const steamId = document.getElementById("steamId").value.trim().toUpperCase();
    const rank = document.getElementById("rank").value.trim();
    const speech = speechInput.value.trim();

    if (nickname.length < 3 || nickname.length > 24) {
      show("Ник должен содержать от 3 до 24 символов.", "error");
      return;
    }
    if (!isValidSteamId(steamId)) {
      show("Укажи корректный SteamID (например, STEAM_0:1:12345678 или 76561198000000000).", "error");
      return;
    }
    if (!rank || rank.length < 2 || rank.length > 40) {
      show("Выбери свой текущий ранг.", "error");
      return;
    }
    if (speech.length < 30 || speech.length > 1500) {
      show("Предвыборная речь должна содержать от 30 до 1500 символов.", "error");
      return;
    }
    if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.startsWith("ВСТАВЬТЕ_") ||
        !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.startsWith("ВСТАВЬТЕ_")) {
      show("Сначала добавь URL и публичный ключ Supabase в файл config.js.", "error");
      return;
    }
    if (!window.supabase?.createClient) {
      show("Не удалось загрузить библиотеку. Обнови страницу и попробуй снова.", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Печать ставится…";

    try {
      const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const { error } = await client.from("candidates").insert({
        nickname,
        steam_id: steamId,
        rank,
        speech
      });

      if (error) {
        if (error.code === "23505") {
          const msg = (error.message || "").includes("steam_id")
            ? "С этого SteamID заявка уже была подана."
            : "С этого игрового ника или SteamID заявка уже была подана.";
          show(msg, "error");
        } else if (error.code === "23514") {
          show("Проверь правильность заполнения полей (SteamID, ник или длина речи).", "error");
        } else if (error.code === "42501") {
          show("Приём заявок закрыт или запрос не разрешён.", "error");
        } else {
          console.error(error);
          show("Не удалось отправить заявку. Проверь настройки Supabase и попробуй позже.", "error");
        }
      } else {
        show("Твоя кандидатура запечатана и передана в Совет Конохи!", "success");
        form.reset();
        updateCounter();
      }
    } catch (err) {
      console.error(err);
      show("Ошибка соединения. Попробуй ещё раз позже.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Поставить печать и подать заявку";
    }
  });
})();
