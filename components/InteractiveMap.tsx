"use client";

import { useEffect, useRef, useState } from "react";
import OwlLogo from "./OwlLogo";

interface Resource {
  name: string;
  category: string;
  address: string;
  homepage: string;
  tel?: string;
  region: string;
  lat?: number;
  lng?: number;
  source?: string;
}

const REGION_COORDS: Record<string, [number, number]> = {
  "서울": [37.5665, 126.9780],
  "경기": [37.2636, 127.0286],
  "인천": [37.4563, 126.7052],
  "부산": [35.1796, 129.0756],
  "대구": [35.8714, 128.6014],
  "광주": [35.1595, 126.8526],
  "대전": [36.3504, 127.3845],
  "울산": [35.5389, 129.3114],
  "세종": [36.4801, 127.2890],
  "강원": [37.8854, 127.7298],
  "충북": [36.6358, 127.4914],
  "충남": [36.6588, 126.6728],
  "전북": [35.8242, 127.1480],
  "전남": [34.8160, 126.4629],
  "경북": [36.5760, 128.5056],
  "경남": [35.2383, 128.6923],
  "제주": [33.4996, 126.5312]
};

// 기관명 해시를 사용한 고정된 분산 좌표 생성 함수
function generateDeterministicCoords(name: string, centerLat: number, centerLng: number): [number, number] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // [-0.15, +0.15] 범위로 난수 스케일링 (지자체 영역 전반으로 고르게 분산하여 실제 위치처럼 분포)
  const latOffset = ((hash & 0xFF) / 255.0 - 0.5) * 0.35;
  const lngOffset = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * 0.35;
  
  return [centerLat + latOffset, centerLng + lngOffset];
}

// 주소에서 상세 지역(구/시/군)을 안전하고 정밀하게 추출하는 함수
function extractSubRegion(address: string): string | null {
  if (!address) return null;
  const parts = address.trim().split(/\s+/);
  for (const part of parts) {
    // 도/광역시 등의 행정 구역명은 상세 자치구/시/군이 아니므로 제외
    if (
      part === "서울특별시" || part === "서울시" ||
      part === "부산광역시" || part === "부산시" ||
      part === "대구광역시" || part === "대구시" ||
      part === "인천광역시" || part === "인천시" ||
      part === "광주광역시" || part === "광주시" ||
      part === "대전광역시" || part === "대전시" ||
      part === "울산광역시" || part === "울산시" ||
      part === "세종특별자치시" || part === "세종시" ||
      part === "경기도" || part === "경기" ||
      part === "강원도" || part === "강원특별자치도" ||
      part === "충청북도" || part === "충북" ||
      part === "충청남도" || part === "충남" ||
      part === "전라북도" || part === "전북" || part === "전북특별자치도" ||
      part === "전라남도" || part === "전남" ||
      part === "경상북도" || part === "경북" ||
      part === "경상남도" || part === "경남" ||
      part === "제주특별자치도" || part === "제주도" || part === "제주"
    ) {
      continue;
    }
    if (part.endsWith("구") || part.endsWith("시") || part.endsWith("군")) {
      return part;
    }
  }
  return null;
}

// 카카오 주소 지오코딩 Promise 래퍼 함수 (메모리 캐시 적용)
function getCoordsFromAddress(geocoder: any, address: string, cache: Record<string, [number, number]>): Promise<[number, number] | null> {
  if (cache[address]) {
    return Promise.resolve(cache[address]);
  }
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (result: any, status: any) => {
      const kakao = (window as any).kakao;
      if (kakao && status === kakao.maps.services.Status.OK && result && result.length > 0) {
        const coords: [number, number] = [parseFloat(result[0].y), parseFloat(result[0].x)];
        cache[address] = coords; // 메모리 캐시에 매핑 결과 기록
        resolve(coords);
      } else {
        resolve(null);
      }
    });
  });
}


export default function InteractiveMap({ userRegion, onBack }: { userRegion: string; onBack: () => void }) {
  const [selectedRegion, setSelectedRegion] = useState(userRegion || "서울");
  const [resources, setResources] = useState<Resource[]>([]);
  const [subRegions, setSubRegions] = useState<string[]>([]);
  const [selectedSubRegion, setSelectedSubRegion] = useState("전체");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCenter, setSelectedCenter] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const geocodeCacheRef = useRef<Record<string, [number, number]>>({});

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const activePopupRef = useRef<any>(null);

  // resources 데이터 변경 시 구/시/군 상세 지역 및 기관구분 리스트 동적 추출
  useEffect(() => {
    const subList = new Set<string>();
    const catList = new Set<string>();
    
    resources.forEach(item => {
      const sub = extractSubRegion(item.address);
      if (sub) {
        subList.add(sub);
      }
      if (item.category) {
        catList.add(item.category);
      }
    });
    
    setSubRegions(Array.from(subList).sort());
    setSelectedSubRegion("전체");
    
    const uniqueCats = Array.from(catList).sort();
    setCategories(uniqueCats);
    setSelectedCategories(uniqueCats);
  }, [resources]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayResources = resources.filter(item => {
    const matchesSubRegion = selectedSubRegion === "전체" || extractSubRegion(item.address) === selectedSubRegion;
    const matchesCategory = selectedCategories.includes(item.category);
    const matchesSearch = searchQuery.trim() === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesSubRegion && matchesCategory && matchesSearch;
  });


  // 1. API 데이터 로드
  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/resources/search?region=${selectedRegion}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "success") {
            const data: Resource[] = json.data;
            const center = REGION_COORDS[selectedRegion] || REGION_COORDS["서울"];
            
            // 해시 기반 좌표 매핑
            const mapped = data.map(item => {
              const [lat, lng] = generateDeterministicCoords(item.name, center[0], center[1]);
              return { ...item, lat, lng, tel: item.tel || '' };
            });
            setResources(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load map resource data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [selectedRegion]);

  // 2. 카카오 지도 CDN 동적 마운트 및 지도 초기화 (최초 1회 실행)
  useEffect(() => {
    let active = true;

    function injectKakao(callback: () => void) {
      if ((window as any).kakao && (window as any).kakao.maps) {
        callback();
        return;
      }

      const existingScript = document.getElementById("kakao-js") as HTMLScriptElement;
      if (existingScript) {
        const handleLoad = () => {
          if (active) {
            (window as any).kakao.maps.load(callback);
          }
        };
        existingScript.addEventListener("load", handleLoad);
        if ((window as any).kakao && (window as any).kakao.maps) {
          existingScript.removeEventListener("load", handleLoad);
          if (active) callback();
        }
        return;
      }

      const script = document.createElement("script");
      script.id = "kakao-js";
      script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=5c69c3da4775426ecd61c8817d4fcd28&libraries=services&autoload=false";
      script.onload = () => {
        if (active && (window as any).kakao) {
          (window as any).kakao.maps.load(callback);
        }
      };
      document.head.appendChild(script);
    }

    injectKakao(() => {
      const kakao = (window as any).kakao;
      if (!kakao || !mapContainerRef.current || mapInstanceRef.current) return;

      const center = REGION_COORDS[selectedRegion] || REGION_COORDS["서울"];
      const options = {
        center: new kakao.maps.LatLng(center[0], center[1]),
        level: 8 // 카카오맵 시/도 광역 기본 뷰
      };

      const map = new kakao.maps.Map(mapContainerRef.current, options);
      mapInstanceRef.current = map;

      // 줌 컨트롤 우측 하단 추가
      const zoomControl = new kakao.maps.ZoomControl();
      map.addControl(zoomControl, kakao.maps.ControlPosition.BOTTOMRIGHT);

      // 마커 업데이트 강제 트리거
      setResources(prev => [...prev]);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. 지역 변경, 상세 지역 변경 및 리소스 로드 시 지도 이동 및 마커 업데이트
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapInstanceRef.current;
    if (!kakao || !map) return;

    let active = true;
    const geocoder = new kakao.maps.services.Geocoder();

    // 기존 마커 및 팝업 완벽 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (activePopupRef.current) {
      activePopupRef.current.setMap(null);
      activePopupRef.current = null;
    }

    const center = REGION_COORDS[selectedRegion] || REGION_COORDS["서울"];

    // A. 현재 내 더미 위치 📍 마커 생성 (중심좌표에서 약간 빗겨난 가상 주거지)
    const myPosLat = center[0] + 0.005;
    const myPosLng = center[1] + 0.005;
    const myPosLatLng = new kakao.maps.LatLng(myPosLat, myPosLng);

    const myLocationHtml = `
      <div class="relative flex items-center justify-center" style="transform: translate(-50%, -50%);">
        <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-red-400 opacity-75"></span>
        <div class="relative flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border-2 border-white shadow-md cursor-pointer">
          <span class="text-[8px] text-white font-black" style="line-height: 1;">N</span>
        </div>
      </div>
    `;

    const myOverlay = new kakao.maps.CustomOverlay({
      position: myPosLatLng,
      content: myLocationHtml,
      clickable: true
    });
    myOverlay.setMap(map);
    markersRef.current.push(myOverlay);

    // 상세 보기 전역 핸들러 연동
    (window as any).selectCenterFromMap = (name: string) => {
      const found = resources.find(r => r.name === name);
      if (found) setSelectedCenter(found);
    };

    // 실시간 주소 지오코딩 및 마커 매핑 비동기 구동
    async function plotMarkers() {
      const markerPromises = displayResources.map(async (item) => {
        let lat = item.lat;
        let lng = item.lng;

        if (item.address) {
          const coords = await getCoordsFromAddress(geocoder, item.address, geocodeCacheRef.current);
          if (coords) {
            lat = coords[0];
            lng = coords[1];
          }
        }

        if (!lat || !lng) {
          const fallback = generateDeterministicCoords(item.name, center[0], center[1]);
          lat = fallback[0];
          lng = fallback[1];
        }

        return { ...item, lat, lng };
      });

      const processedResources = await Promise.all(markerPromises);

      // 경쟁 상태(Race Condition) 방어막
      if (!active) return;

      // 상세 지역 선택 시 해당 영역 평균 좌표 구해서 중심 이동 및 정밀 줌 조정
      let mapCenter = new kakao.maps.LatLng(center[0], center[1]);
      let mapZoom = 8; // 시/도 단위 기본 광역 뷰

      if (selectedSubRegion !== "전체" && processedResources.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        let count = 0;
        processedResources.forEach(item => {
          if (item.lat && item.lng) {
            sumLat += item.lat;
            sumLng += item.lng;
            count++;
          }
        });
        if (count > 0) {
          mapCenter = new kakao.maps.LatLng(sumLat / count, sumLng / count);
          mapZoom = 5; // 구 단위 줌 (카카오맵은 5 수준이 적정한 정밀도)
        }
      } else {
        mapCenter = new kakao.maps.LatLng(center[0], center[1]);
        mapZoom = 8;
      }

      map.setCenter(mapCenter);
      map.setLevel(mapZoom);

      console.log(`Plotting ${processedResources.length} Kakao markers for ${selectedRegion} (subregion: ${selectedSubRegion})`);

      // B. 리소스 기반 커스텀 마커 렌더링
      processedResources.forEach((item) => {
        if (!item.lat || !item.lng) return;

        const isClinic = item.name.includes("병원") || item.name.includes("의원");
        const pinColor = isClinic ? "bg-[#1E2D4E]" : "bg-[#F59E0B]";
        const iconChar = isClinic ? "🏥" : "🏢";

        const position = new kakao.maps.LatLng(item.lat, item.lng);
        const markerContent = document.createElement('div');
        markerContent.className = 'transform hover:scale-110 transition-transform duration-200 cursor-pointer';
        markerContent.style.transform = 'translate(-50%, -50%)';
        markerContent.innerHTML = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${pinColor} text-white shadow-lg border-2 border-white">
            <span class="text-sm">${iconChar}</span>
          </div>
        `;

        const markerOverlay = new kakao.maps.CustomOverlay({
          position: position,
          content: markerContent,
          clickable: true
        });

        markerContent.addEventListener('click', () => {
          setSelectedCenter(item);
          openPopup(item, position);
        });

        markerOverlay.setMap(map);
        markersRef.current.push(markerOverlay);
      });
    }

    // 아늑한 Slate 테마의 커스텀 정보 팝업
    function openPopup(item: any, position: any) {
      if (activePopupRef.current) {
        activePopupRef.current.setMap(null);
      }

      const escapedName = item.name.replace(/'/g, "\\'");
      const popupDiv = document.createElement('div');
      popupDiv.className = 'absolute bg-white rounded-2xl shadow-xl border border-[#EAE5D9] p-3.5 text-left min-w-[180px] z-50';
      popupDiv.style.transform = 'translate(-50%, -125%)'; // 마커 상단 중앙 배치
      popupDiv.innerHTML = `
        <div class="relative">
          <p class="font-extrabold text-xs text-gray-900 mb-1 leading-snug pr-3">${item.name}</p>
          <p class="text-[9px] text-gray-500 mb-2 leading-normal">${item.address}</p>
          <button onclick="window.selectCenterFromMap('${escapedName}')" class="w-full bg-[#1E2D4E] text-[#FAF8F5] text-[9px] font-bold py-1.5 rounded transition-colors hover:bg-opacity-90">
            상세 보기
          </button>
          <button id="popup-close-btn" class="absolute top-0 right-0 text-gray-400 hover:text-gray-600 font-extrabold text-sm" style="line-height: 1;">×</button>
        </div>
      `;

      popupDiv.querySelector('#popup-close-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        popupOverlay.setMap(null);
        if (activePopupRef.current === popupOverlay) {
          activePopupRef.current = null;
        }
      });

      const popupOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: popupDiv,
        clickable: true
      });

      popupOverlay.setMap(map);
      activePopupRef.current = popupOverlay;
    }

    plotMarkers();

    return () => {
      active = false;
      delete (window as any).selectCenterFromMap;
    };
  }, [displayResources, selectedRegion, selectedSubRegion]);


  const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

  return (
    <div className="max-w-5xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.08)] flex flex-col animate-fade-in text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-5 text-white flex justify-between items-center border-b border-[#EAE5D9]">
        <div className="flex items-center gap-3">
          <OwlLogo size={36} variant="ivory" />
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              📍 내 주변 심리상담센터 찾기
            </h2>
            <p className="text-xs opacity-90 mt-1">사용자의 거주지를 중심으로 인근의 우수한 지자체 복지센터 및 병원 정보를 보여줍니다.</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F5EFE6] text-[#8C7862] hover:text-[#1E2D4E] font-bold text-xs rounded-xl transition-all border border-[#EAE5D9] shadow-sm flex items-center gap-1"
        >
          ← 이전으로 돌아가기
        </button>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-6 h-[550px]">
        {/* Left Side: Map and Controls */}
        <div className="flex-1 flex flex-col gap-4 h-full">
          {/* Controls */}
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-[#EAE5D9] shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#8C7862]">🔍 지역 변경:</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedCenter(null);
                    setSearchQuery(""); // 지역 변경 시 검색어 초기화
                  }}
                  className="bg-[#F8F5F0] border border-[#EAE5D9] rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C7862] font-bold cursor-pointer"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#8C7862]">📍 상세 지역:</span>
                <select
                  value={selectedSubRegion}
                  onChange={(e) => {
                    setSelectedSubRegion(e.target.value);
                    setSelectedCenter(null);
                    setSearchQuery(""); // 상세 지역 변경 시 검색어 초기화
                  }}
                  className="bg-[#F8F5F0] border border-[#EAE5D9] rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C7862] font-bold cursor-pointer"
                >
                  <option value="전체">전체 ({resources.filter(item => selectedCategories.includes(item.category)).length}개)</option>
                  {subRegions.map(sr => {
                    const count = resources.filter(item => extractSubRegion(item.address) === sr && selectedCategories.includes(item.category)).length;
                    return (
                      <option key={sr} value={sr}>
                        {sr} ({count}개)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 기관구분 (체크박스 드롭다운) */}
              <div className="flex items-center gap-2 relative z-30" ref={dropdownRef}>
                <span className="text-xs font-extrabold text-[#8C7862]">🏢 기관구분:</span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="bg-[#F8F5F0] border border-[#EAE5D9] rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C7862] font-bold flex items-center gap-1.5 select-none hover:bg-[#F3EFE6] transition-colors"
                >
                  <span>
                    {selectedCategories.length === 0
                      ? "선택 없음"
                      : selectedCategories.length === categories.length
                      ? "전체 선택됨"
                      : `${selectedCategories.length}개 선택됨`}
                  </span>
                  <span className="text-[9px] text-gray-500">{dropdownOpen ? "▲" : "▼"}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#EAE5D9] rounded-2xl shadow-xl z-50 p-3 animate-fade-in text-xs flex flex-col gap-2">
                    {/* Helper actions */}
                    <div className="flex items-center justify-between border-b border-[#FAF8F5] pb-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCategories(categories)}
                        className="text-[10px] text-[#8C7862] hover:text-[#1E2D4E] font-black hover:underline"
                      >
                        ✓ 전체 선택
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[10px] text-gray-400 hover:text-red-500 font-black hover:underline"
                      >
                        ✗ 전체 해제
                      </button>
                    </div>

                    {/* Checkbox Options */}
                    <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-thin">
                      {categories.map(cat => {
                        const isChecked = selectedCategories.includes(cat);
                        const count = resources.filter(item => item.category === cat && (selectedSubRegion === "전체" || extractSubRegion(item.address) === selectedSubRegion)).length;
                        return (
                          <label
                              key={cat}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#FDFBF7] cursor-pointer transition-colors text-gray-700 font-semibold select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                } else {
                                  setSelectedCategories([...selectedCategories, cat]);
                                }
                                setSelectedCenter(null);
                              }}
                              className="rounded border-[#C5BBA6] text-[#8C7862] focus:ring-[#8C7862] cursor-pointer h-3.5 w-3.5"
                            />
                            <span className="flex-1 truncate">{cat}</span>
                            <span className="text-[9px] text-[#A69584] font-bold">({count}개)</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 기관명 검색창 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#8C7862]">🔍 기관명 검색:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedCenter(null);
                    }}
                    placeholder="기관명을 입력하세요..."
                    className="bg-[#F8F5F0] border border-[#EAE5D9] rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C7862] font-semibold w-44 placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCenter(null);
                      }}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 font-extrabold text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

            </div>
            <span className="text-[11px] text-gray-400 font-semibold hidden sm:inline">
              내 거주지: <strong className="text-[#8C7862] underline font-extrabold">{userRegion || "미등록(기본 서울)"}</strong>
            </span>
          </div>


          {/* Map Container */}
          <div className="flex-1 relative rounded-3xl border border-[#EAE5D9] overflow-hidden shadow-inner bg-[#F8F5F0]">
            <div ref={mapContainerRef} className="w-full h-full z-10" />
            {loading && (
              <div className="absolute inset-0 bg-[#FAF8F5]/80 z-20 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#8C7862] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-[#8C7862] font-bold">인근 전문 상담 기관 로딩 중...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Center details card panel */}
        <div className="w-full md:w-80 flex flex-col h-full bg-white rounded-3xl border border-[#EAE5D9] p-5 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
          <h3 className="font-extrabold text-sm text-[#1E2D4E] border-b border-[#EAE5D9] pb-3 mb-4 flex items-center gap-2 select-none">
            📋 상세 정보 카드
          </h3>

          {selectedCenter ? (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div className="flex flex-col gap-4">
                {/* Badge Category */}
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black text-white ${
                    selectedCenter.category.includes("의료기관") || selectedCenter.name.includes("병원") || selectedCenter.name.includes("의원") ? "bg-[#1E2D4E]" : "bg-[#F59E0B]"
                  }`}>
                    {selectedCenter.category.includes("의료기관") || selectedCenter.name.includes("병원") || selectedCenter.name.includes("의원") ? "🏥 " : "🏢 "}
                    {selectedCenter.category || "기관구분 없음"}
                  </span>
                </div>

                {/* Name */}
                <h4 className="font-black text-lg text-gray-900 leading-snug tracking-tight">
                  {selectedCenter.name}
                </h4>

                {/* Info Fields */}
                <div className="flex flex-col gap-3 text-xs leading-relaxed text-gray-600 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5D9]/60">
                  <div>
                    <p className="font-bold text-[#8C7862] text-[10px] uppercase tracking-wider mb-0.5">상세 주소</p>
                    <p className="text-gray-800 font-medium">{selectedCenter.address}</p>
                  </div>
                  {selectedCenter.tel && selectedCenter.tel !== '' && (
                    <div>
                      <p className="font-bold text-[#8C7862] text-[10px] uppercase tracking-wider mb-0.5">📞 연락처</p>
                      <a
                        href={`tel:${selectedCenter.tel}`}
                        className="text-[#1E2D4E] font-bold hover:underline"
                      >
                        {selectedCenter.tel}
                      </a>
                    </div>
                  )}
                  {(!selectedCenter.tel || selectedCenter.tel === '') && (
                    <div>
                      <p className="font-bold text-[#8C7862] text-[10px] uppercase tracking-wider mb-0.5">📞 연락처</p>
                      <p className="text-gray-400 font-medium">연락처 정보 없음</p>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[#8C7862] text-[10px] uppercase tracking-wider mb-0.5">권역 구분</p>
                    <p className="text-gray-800 font-medium">{selectedCenter.region} 권역</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-6">
                {selectedCenter.homepage && selectedCenter.homepage !== "정보 없음" ? (
                  <a
                    href={selectedCenter.homepage.startsWith("http") ? selectedCenter.homepage : `http://${selectedCenter.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1E2D4E] hover:bg-[#2A3B5C] text-white font-bold py-3 px-4 rounded-xl text-xs text-center shadow-md transition-all flex items-center justify-center gap-1 hover:translate-y-[-1px]"
                  >
                    🔗 홈페이지 바로가기 ↗
                  </a>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded-xl text-xs text-center border border-gray-200 select-none">
                    📭 제공된 홈페이지 주소 없음
                  </div>
                )}
                
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  * 공공데이터 기준이며 실제 운영 정보와 소폭 다를 수 있습니다. 방문 전 확인을 권장합니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EAE5D9]">
              <span className="text-3xl mb-2 animate-bounce">📍</span>
              <p className="text-xs font-bold text-gray-400 leading-relaxed">
                지도에서 핀을 클릭하시거나<br/>
                마커의 '상세 보기'를 눌러 주세요.<br/>
                상담소 상세 정보가 이곳에 나타납니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
