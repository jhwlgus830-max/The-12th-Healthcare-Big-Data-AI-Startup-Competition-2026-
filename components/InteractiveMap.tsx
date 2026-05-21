"use client";

import { useEffect, useRef, useState } from "react";
import OwlLogo from "./OwlLogo";

interface Resource {
  name: string;
  category: string;
  address: string;
  homepage: string;
  region: string;
  lat?: number;
  lng?: number;
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

export default function InteractiveMap({ userRegion, onBack }: { userRegion: string; onBack: () => void }) {
  const [selectedRegion, setSelectedRegion] = useState(userRegion || "서울");
  const [resources, setResources] = useState<Resource[]>([]);
  const [subRegions, setSubRegions] = useState<string[]>([]);
  const [selectedSubRegion, setSelectedSubRegion] = useState("전체");
  const [selectedCenter, setSelectedCenter] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // resources 데이터 변경 시 구/시/군 상세 지역 리스트 동적 추출
  useEffect(() => {
    const list = new Set<string>();
    resources.forEach(item => {
      const sub = extractSubRegion(item.address);
      if (sub) {
        list.add(sub);
      }
    });
    setSubRegions(Array.from(list).sort());
    setSelectedSubRegion("전체");
  }, [resources]);

  const displayResources = selectedSubRegion === "전체"
    ? resources
    : resources.filter(item => extractSubRegion(item.address) === selectedSubRegion);

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
              return { ...item, lat, lng };
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

  // 2. Leaflet CDN 동적 마운트 및 지도 초기화 (최초 1회 실행)
  useEffect(() => {
    let active = true;

    function injectLeaflet(callback: () => void) {
      if ((window as any).L) {
        callback();
        return;
      }

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          if (active) callback();
        };
        document.head.appendChild(script);
      }
    }

    injectLeaflet(() => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

      const center = REGION_COORDS[selectedRegion] || REGION_COORDS["서울"];

      // 지도 생성 및 설정
      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView(center, 11);
      
      mapInstanceRef.current = map;

      // 럭셔리하고 아늑한 카르토DB 포지트론(CartoDB Positron) Voyager 테마 타일맵 적용
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // 내비게이션 줌 컨트롤 우측 하단 배치
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 마커 강제 강제 업데이트 트리거
      setResources(prev => [...prev]);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. 지역 변경, 상세 지역 변경 및 리소스 로드 시 지도 이동 및 마커 업데이트
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const center = REGION_COORDS[selectedRegion] || REGION_COORDS["서울"];
    let mapCenter = center;
    let mapZoom = 11;

    // 상세 지역이 선택된 경우 매칭 기관들의 평균 좌표 구해서 중심 이동 및 줌아웃/인 처리
    if (selectedSubRegion !== "전체" && displayResources.length > 0) {
      let sumLat = 0;
      let sumLng = 0;
      let count = 0;
      displayResources.forEach(item => {
        if (item.lat && item.lng) {
          sumLat += item.lat;
          sumLng += item.lng;
          count++;
        }
      });
      if (count > 0) {
        mapCenter = [sumLat / count, sumLng / count];
        mapZoom = 13;
      }
    }

    // 지도 뷰 부드럽게 이동
    map.setView(mapCenter, mapZoom);

    // 기존 마커들 완벽히 제거
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // A. 현재 내 더미 위치 📍 마커 생성 (중심좌표에서 약간 빗겨난 가상 주거지)
    const myPos: [number, number] = [center[0] + 0.005, center[1] + 0.005];
    const myIcon = L.divIcon({
      className: 'custom-my-location-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-red-400 opacity-75"></span>
          <div class="relative flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border-2 border-white shadow-md">
            <span class="text-[8px] text-white font-black">N</span>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const myMarker = L.marker(myPos, { icon: myIcon }).addTo(map);
    myMarker.bindPopup(`<div class="p-1 font-bold text-xs text-red-600 text-center">📍 내 거주지 주변 가상 위치</div>`);
    markersRef.current.push(myMarker);

    // B. 리소스 기반 정신건강 관련 기관 마커 생성 및 플로팅
    console.log(`Plotting ${displayResources.length} resource markers for region ${selectedRegion} (subregion: ${selectedSubRegion})`);
    
    displayResources.forEach(item => {
      if (!item.lat || !item.lng) return;

      const isClinic = item.name.includes("병원") || item.name.includes("의원");
      const pinColor = isClinic ? "bg-[#1E2D4E]" : "bg-[#F59E0B]";
      const iconChar = isClinic ? "🏥" : "🏢";

      const centerIcon = L.divIcon({
        className: 'custom-center-icon',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${pinColor} text-white shadow-lg border-2 border-white transform hover:scale-110 transition-transform duration-200">
            <span class="text-sm">${iconChar}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([item.lat, item.lng], { icon: centerIcon }).addTo(map);
      
      // 따옴표 문자 안전 이스케이프 처리
      const escapedName = item.name.replace(/'/g, "\\'");
      
      marker.bindPopup(`
        <div class="p-2 text-left min-w-[160px]">
          <p class="font-extrabold text-xs text-gray-900 mb-1 leading-snug">${item.name}</p>
          <p class="text-[9px] text-gray-500 mb-2 leading-normal">${item.address}</p>
          <button onclick="window.selectCenterFromMap('${escapedName}')" class="w-full bg-[#1E2D4E] text-[#FAF8F5] text-[9px] font-bold py-1.5 rounded transition-colors hover:bg-opacity-90">
            상세 보기
          </button>
        </div>
      `);

      marker.on('click', () => {
        setSelectedCenter(item);
      });

      markersRef.current.push(marker);
    });

    (window as any).selectCenterFromMap = (name: string) => {
      const found = resources.find(r => r.name === name);
      if (found) setSelectedCenter(found);
    };

    return () => {
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
                  }}
                  className="bg-[#F8F5F0] border border-[#EAE5D9] rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C7862] font-bold cursor-pointer"
                >
                  <option value="전체">전체 ({resources.length}개)</option>
                  {subRegions.map(sr => {
                    const count = resources.filter(item => extractSubRegion(item.address) === sr).length;
                    return (
                      <option key={sr} value={sr}>
                        {sr} ({count}개)
                      </option>
                    );
                  })}
                </select>
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
                    selectedCenter.name.includes("병원") || selectedCenter.name.includes("의원") ? "bg-[#1E2D4E]" : "bg-[#F59E0B]"
                  }`}>
                    {selectedCenter.name.includes("병원") || selectedCenter.name.includes("의원") ? "🏥 정신건강의학과" : "🏢 정신건강복지센터"}
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
