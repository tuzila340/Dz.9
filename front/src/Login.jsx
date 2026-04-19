import "./App.css";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";

const loginSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

function LogInDialog({ onLogin }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await axios.post(
        "http://localhost:5244/api/users",
        {
          username: data.username,
          email: data.email,
        },
        { withCredentials: true }
      );

      if (onLogin) onLogin();
    } catch (err) {
      console.error("Error:", err.response?.data);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
        <h2 style={styles.title}>Log In</h2>
        <p style={styles.subtitle}>Please enter your credentials to log in.</p>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="username">Username</label>
          <input
            id="username"
            placeholder="Username"
            style={styles.input}
            {...register("username")}
          />
          {errors.username && <p style={styles.error}>{errors.username.message}</p>}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            placeholder="Email"
            style={styles.input}
            {...register("email")}
          />
          {errors.email && <p style={styles.error}>{errors.email.message}</p>}
        </div>

        <button type="submit" style={styles.button}>Log In</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    maxWidth: "400px",
    padding: "32px",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    backgroundColor: "#fff",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "500",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#888",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
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
  },
  error: {
    margin: 0,
    fontSize: "12px",
    color: "red",
  },
  button: {
    padding: "10px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#000",
    color: "#fff",
  },
};

export default LogInDialog;