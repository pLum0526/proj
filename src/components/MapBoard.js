import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserPosts, transformPostData } from '../services/postService';

// 지도 구역별 중심좌표 및 줌 정보
const regionMap = {
  '전체':   { lat: 36.5, lng: 127.8, zoom: 7 }, // 전국 중심, 줌아웃
  '서울':    { lat: 37.5665, lng: 126.9780, zoom: 11 },
  '부산':    { lat: 35.1796, lng: 129.0756, zoom: 11 },
  '대구':    { lat: 35.8714, lng: 128.6014, zoom: 11 },
  '인천':    { lat: 37.4563, lng: 126.7052, zoom: 11 },
  '광주':    { lat: 35.1595, lng: 126.8526, zoom: 11 },
  '대전':    { lat: 36.3504, lng: 127.3845, zoom: 11 },
  '울산':    { lat: 35.5384, lng: 129.3114, zoom: 11 },
};
const regionList = Object.keys(regionMap);

const MapBoard = () => {
  const { currentUser, logout } = useAuth();
  const [map, setMap] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [userPosts, setUserPosts] = useState([]);
  const navigate = useNavigate();
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);

  const [ selectedDate, setSelectedDate] = useState(new Date());
  const [ startDate, setStartDate] = useState(new Date());  
  const [ endDate, setEndDate] = useState(new Date());
  const [ dateError, setDateError] = useState('');
  const [ selectedPost, setSelectedPost] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const fetchUserPosts = async () => {
      try {
        const posts = await getUserPosts(currentUser.uid);
        setUserPosts(posts.map(transformPostData));
      } catch (e) {
        setUserPosts([]);
      }
    };
    fetchUserPosts();
  }, [currentUser]);

  // 지도 생성
  useEffect(() => {
    const initMap = () => {
      const mapContainer = document.getElementById('map');
      if (mapContainer && window.google) {
        const mapInstance = new window.google.maps.Map(mapContainer, {
          center: regionMap[selectedRegion],
          zoom: regionMap[selectedRegion].zoom,
          disableDefaultUI: true,
        });
        setMap(mapInstance);
      }
    };

    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      initMap();
    }
    // eslint-disable-next-line
  }, [selectedRegion]);

  // 마커 렌더링 (map, region이 바뀔 때마다)
  useEffect(() => {
    if (!map || !window.google) return;

    // 기존 마커/인포윈도우 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    infoWindowsRef.current.forEach(info => info.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    // 전체면 모든 데이터, 아니면 해당 구역만
    const regionData = selectedRegion === '전체'
      ? userPosts
      : userPosts.filter(item => {
          const center = regionMap[selectedRegion];
          return (
            Math.abs(item.lat - center.lat) < 0.7 &&
            Math.abs(item.lng - center.lng) < 0.7
          );
        });

    regionData.forEach((item) => {
      const marker = new window.google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map: map,
        title: item.title,
      });
      const imgSrc = Array.isArray(item.image) && item.image.length > 0 ? item.image[0].url : '';
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="width:150px">
        <img src="${imgSrc}" alt="사진" style="width:100%;height:80px;object-fit:cover;border-radius:6px;" />
        <div style="margin-top:4px;font-weight:bold;">${item.title}</div>
        <div style="display:flex;justify-content:space-between;">
          <div style="margin-top:2px;font-size:13px;color:#555;">${item.date}</div>
          <div style="margin-top:2px;font-size:13px;color:#555;">${item.date2 ? '@' +item.date2 : ''}</div>
        </div>
      </div>`
      });
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });
      marker.addListener('mouseout', () => {
        infoWindow.close();
      });
      marker.addListener('click', () => {
        navigate(`/detail/${currentUser.uid}/${item.id}`);
      });
      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
    });
  }, [map, selectedRegion, navigate, userPosts, currentUser]);

  useEffect(() => {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setDateError('날짜를 올바르게 입력하세요.');
    } else if (startDate > endDate) {
      setDateError('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const filteredData = userPosts.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
  });
  

  return (
    <>
    <main className="flex justify-center gap-10 mt-10 px-10">
    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-[320px] flex flex-col">
          <h3 className="font-semibold mb-4 text-center">게시글 목록</h3>
          {dateError ? (
            <div className="text-red-500 text-center mb-2">{dateError}</div>
          ) : filteredData.length === 0 ? (
            <div className="text-gray-500 text-center mb-2">표시할 게시물이 없습니다.</div>
          ) : (
            <ul>
              {filteredData.map(item => (
                <li
                  key={item.id}
                  className={`cursor-pointer p-2 rounded mb-1 hover:bg-blue-100 ${selectedPost && selectedPost.id === item.id ? 'bg-blue-200 hover:bg-blue-200' : ''}`}
                  onClick={() => {setSelectedPost(item); navigate(`/detail/${currentUser.uid}/${item.id}`);}}
                >
                  <span className="font-bold">{item.title}</span>
                  <span className="ml-2 text-gray-500 text-sm">{item.date}</span>
                  
                </li>
              ))}
            </ul>
          )}
        </div>
      {/* 가운데: 지도 */}
      <div className="w-[600px] h-[600px] bg-blue-100 shadow-lg rounded-lg overflow-hidden relative">
        {/* 구역 드랍다운 */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded shadow px-3 py-2">
          <label className="mr-2 font-semibold">구역별 보기:</label>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {regionList.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div id="map" className="w-full h-full"></div>
      </div>

      {/* 오른쪽: 유저 정보 및 카드 */}
      <div className="flex flex-col gap-6">
        {/* 유저 정보 */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center overflow-hidden">
            <img src={currentUser.photoURL} alt="프로필" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{currentUser.displayName || '사용자'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              로그아웃
            </button>
          </div>
        </div>

        <button 
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          onClick={() => navigate('/upload')}
        >
          글쓰기
        </button>
      </div>
    </main>
    {/* 날짜 구간 조회 */}
    <main className="flex-col gap-10 mt-10 px-10 flex items-center justify-center">
      <div className="flex items-center justify-center gap-3 mb-4 bg-white p-5 rounded-xl shadow-xl">
        <h3 className="text-xl font-bold">날짜 구간 조회</h3>
        <input
          type="date"
          value={
            !startDate || isNaN(startDate.getTime())
              ? ''
              : startDate.toISOString().slice(0, 10)
          }
          onChange={e => {
            const value = e.target.value;
            setStartDate(value ? new Date(value) : new Date('Invalid'));
          }}
          className="border rounded px-2 py-1"
        />
        <span className="mx-2">~</span>
        <input
          type="date"
          value={
            !endDate || isNaN(endDate.getTime())
              ? ''
              : endDate.toISOString().slice(0, 10)
          }
          onChange={e => {
            const value = e.target.value;
            setEndDate(value ? new Date(value) : new Date('Invalid'));
          }}
          className="border rounded px-2 py-1"
        />
      </div>
    </main>
    </>
  );
};

export default MapBoard;
