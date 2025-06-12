import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import MapBoard from './components/MapBoard';
import UploadForm from './components/UploadForm';
import BoardDate from './components/BoardDate';
import Detail from './components/Detail';
import MemberUpdate from './components/MemberUpdate';
import MyPage from './components/MyPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Navbar를 조건부로 렌더링하는 컴포넌트
const NavbarWrapper = () => {
  const location = useLocation();
  return location.pathname !== '/' ? <Navbar /> : null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="bg-gray-200 min-h-screen">
          <NavbarWrapper />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/board_select"
              element={
                <PrivateRoute>
                  <div>게시판 선택 페이지</div>
                </PrivateRoute>
              }
            />
            <Route
              path="/board_map"
              element={
                <PrivateRoute>
                  <MapBoard />
                </PrivateRoute>
              }
            />
            <Route
              path="/board_date"
              element={
                <PrivateRoute>
                  <BoardDate />
                </PrivateRoute>
              }
            />
            <Route
              path="/detail"
              element={
                <PrivateRoute>
                  <div className="p-10 text-center">글을 선택해주세요.</div>
                </PrivateRoute>
              }
            />
            <Route
              path="/detail/:userId/:id"
              element={
                <PrivateRoute>
                  <Detail />
                </PrivateRoute>
              }
            />
            <Route
              path="/mypage"
              element={
                <PrivateRoute>
                  <MyPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/member_update"
              element={
                <PrivateRoute>
                  <MemberUpdate />
                </PrivateRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <PrivateRoute>
                  <UploadForm />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 