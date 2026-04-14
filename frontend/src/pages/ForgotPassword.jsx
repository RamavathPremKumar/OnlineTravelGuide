import { apiRequest } from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage("Please enter your email address");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await apiRequest("/auth/forgot-password", "POST", { email: email.trim() });
      
      // Success (200 or 201)
      setSuccessMessage(data.message || "Password reset link has been sent to your email!");
      setEmail("");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      if (error.status === 404) {
        setErrorMessage(
          <div>
            <strong>Email not found!</strong><br />
            This email is not registered. Please check your email or{" "}
            <Link to="/register" style={{color: "#3498db", fontWeight: "bold"}}>
              register for an account
            </Link>.
          </div>
        );
      } else {
        setErrorMessage(error.message || "Failed to process request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page-wrapper">
      <div className="forgot-password-container">
        <h2 className="forgot-password-title">Forgot Password</h2>
        <p className="forgot-password-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {successMessage && (
          <div className="alert alert-success">
            <div className="alert-content">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>{successMessage}</strong>
                <p>You will be redirected to login page...</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <div className="alert-content">
              <i className="fas fa-exclamation-circle"></i>
              <div>
                {typeof errorMessage === 'string' ? (
                  <>
                    <strong>Error!</strong>
                    <p>{errorMessage}</p>
                  </>
                ) : (
                  <div>{errorMessage}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              Email Address:
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Sending...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="back-to-login">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;