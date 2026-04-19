import { useState } from "react";
import axios from "axios";

function PushPanel({ userId }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleSubscribe = async () => {
    if (!userId) {
      showMessage("Спочатку зареєструйтесь!", "error");
      return;
    }
    try {
      const { data: vapidKey } = await axios.get(
        "http://localhost:5244/api/push/vapid-public-key"
      );

      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      await axios.post(
        "http://localhost:5244/api/push/subscribe",
        {
          userId,
          endpoint: pushSubscription.endpoint,
          p256dh: btoa(
            String.fromCharCode(
              ...new Uint8Array(pushSubscription.getKey("p256dh"))
            )
          ),
          auth: btoa(
            String.fromCharCode(
              ...new Uint8Array(pushSubscription.getKey("auth"))
            )
          ),
        },
        { withCredentials: true }
      );

      setIsSubscribed(true);
      showMessage("Підписку оформлено успішно!");
    } catch (err) {
      showMessage("Помилка підписки: " + err.message, "error");
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      setIsSubscribed(false);
      showMessage("Відписано успішно!");
    } catch (err) {
      showMessage("Помилка відписки: " + err.message, "error");
    }
  };

  const handleSendToUser = async () => {
    if (!targetUserId) {
      showMessage("Введіть UserId!", "error");
      return;
    }
    try {
      await axios.post(
        `http://localhost:5244/api/push/send/${targetUserId}`,
        {
          title: notifTitle || "Тест",
          body: notifBody || "Тестове повідомлення",
        },
        { withCredentials: true }
      );
      showMessage(`Сповіщення надіслано користувачу ${targetUserId}!`);
    } catch (err) {
      showMessage("Помилка: " + err.response?.data, "error");
    }
  };

  const handleSendToAll = async () => {
    try {
      await axios.post(
        "http://localhost:5244/api/push/broadcast",
        {
          title: notifTitle || "Тест",
          body: notifBody || "Тестове повідомлення",
        },
        { withCredentials: true }
      );
      showMessage("Сповіщення надіслано всім підписникам!");
    } catch (err) {
      showMessage("Помилка: " + err.response?.data, "error");
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Push-сповіщення</h2>
      <p style={styles.subtitle}>Підписка прив'язана до вашого UserId</p>

      <div style={styles.divider} />

      <p style={styles.sectionLabel}>Підписка</p>
      <button
        style={isSubscribed ? styles.btnDanger : styles.btnPrimary}
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      >
        {isSubscribed ? "Відписатися" : "Підписатися на сповіщення"}
      </button>

      <div style={styles.divider} />

      <p style={styles.sectionLabel}>Текст сповіщення</p>
      <div style={styles.field}>
        <label style={styles.label}>Заголовок</label>
        <input
          placeholder="Заголовок"
          style={styles.input}
          value={notifTitle}
          onChange={(e) => setNotifTitle(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Повідомлення</label>
        <input
          placeholder="Текст повідомлення"
          style={styles.input}
          value={notifBody}
          onChange={(e) => setNotifBody(e.target.value)}
        />
      </div>

      <div style={styles.divider} />

      <p style={styles.sectionLabel}>Надіслати конкретному користувачу</p>
      <div style={styles.row}>
        <input
          placeholder="UserId"
          style={{ ...styles.input, flex: 1 }}
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
        />
        <button style={styles.btnSecondary} onClick={handleSendToUser}>
          Надіслати
        </button>
      </div>

      <div style={styles.divider} />

      <p style={styles.sectionLabel}>Надіслати всім підписникам</p>
      <button style={styles.btnSecondary} onClick={handleSendToAll}>
        Надіслати всім
      </button>

      {message.text && (
        <div style={message.type === "error" ? styles.alertError : styles.alertSuccess}>
          {message.text}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "28px",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    backgroundColor: "#fff",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: "500",
  },
  subtitle: {
    margin: "0 0 16px",
    fontSize: "13px",
    color: "#888",
  },
  sectionLabel: {
    margin: "0 0 8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#555",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "10px",
  },
  label: {
    fontSize: "13px",
    color: "#555",
  },
  input: {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    width: "100%",
  },
  row: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  btnPrimary: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#000",
    color: "#fff",
  },
  btnSecondary: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#fff",
    color: "#000",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#e53935",
    color: "#fff",
  },
  divider: {
    height: "1px",
    backgroundColor: "#f0f0f0",
    margin: "16px 0",
  },
  alertSuccess: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "14px",
  },
  alertError: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    fontSize: "14px",
  },
};

export default PushPanel;