import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 이미 로그인된 사용자는 board_map으로 리다이렉트
  React.useEffect(() => {
    if (currentUser) {
      navigate('/board_map');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/board_map');
    } catch (error) {
      setError('구글 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">LOGIN</h2>
        <div className="flex flex-col items-center">
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="login-button-google"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
            />
            {loading ? '로그인 중...' : 'Google로 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 