"use client";

import { useRef, useState, useEffect } from "react";
import {
  FaPause,
  FaPlay,
  FaBackward,
  FaForward,
  FaVolumeUp,
  FaVolumeMute,
  FaVideo,
} from "react-icons/fa";

const videoList = [
  {
    file: "pokemon_Abertura.mp4",
    title: "Pokenon Inicio",
    icon: "pokémon.png",
  },
  {
    file: "pokemon_iniciais.mp4",
    title: "Todos os Iniciais",
    icon: "pokémon.png",
  },
  {
    file: "pokemon_lendarios.mp4",
    title: "Todos os Lendario",
    icon: "pokémon.png",
  },
];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Guardar rafId em ref para controlar o loop do requestAnimationFrame
  const rafIdRef = useRef<number | null>(null);

  const [currentVideo, setCurrentVideo] = useState(videoList[0].file);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Carregando...");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quando troca o vídeo
  useEffect(() => {
    const vid = videoList.find((v) => v.file === currentVideo);
    setVideoTitle(vid?.title || "Desconhecido");
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsVideoReady(false);
    setError(null);

    if (videoRef.current) {
      const video = videoRef.current;
      video.pause();
      video.removeAttribute("src");
      video.load();
      setTimeout(() => {
        video.src = currentVideo;
        video.load();
      }, 50);
    }
  }, [currentVideo]);

  // Eventos do vídeo para controlar duração, tempo, play/pause etc
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      rafIdRef.current = requestAnimationFrame(updateTime);
    };

    const onLoadedMetadata = () => {
      const dur = video.duration;
      if (!isFinite(dur) || dur === 0) return;
      if (dur > 10 || dur > duration) {
        setDuration(dur);
        setIsVideoReady(true);
        setError(null);
      }
    };

    const onDurationChange = () => {
      const dur = video.duration;
      if (!isFinite(dur) || dur === 0) return;
      if (dur > 10 || dur > duration) {
        setDuration(dur);
      }
    };

    const onCanPlay = () => {
      setIsVideoReady(true);
      setError(null);
    };

    const onPlay = () => {
      setPlaying(true);
      if (rafIdRef.current === null) rafIdRef.current = requestAnimationFrame(updateTime);
    };

    const onPause = () => {
      setPlaying(false);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const onEnded = () => {
      setPlaying(false);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setCurrentTime(duration);
    };

    const onError = () => {
      setError("Erro ao carregar o vídeo.");
      setIsVideoReady(false);
      setPlaying(false);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [currentVideo, duration]);

  // Atualiza volume e mudo
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleSelectVideo = (file: string) => {
    if (file !== currentVideo) setCurrentVideo(file);
  };

  const playPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.pause();
    else video.play();
  };

  const seekBackward = () => {
    if (videoRef.current)
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  };

  const seekForward = () => {
    if (videoRef.current)
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      video.volume = 0.5;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const bar = e.currentTarget;
    const clickX = e.clientX - bar.getBoundingClientRect().left;
    const width = bar.offsetWidth;
    const newTime = (clickX / width) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="w-screen h-screen bg-[#121212] flex justify-center items-center font-sans text-white">
      <div className="group bg-[#1a1a1a] rounded-l-[20px] h-[580px] w-24 hover:w-[300px] p-6 shadow-lg shadow-black/50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 flex-shrink-0 whitespace-nowrap">
              <FaVideo className="inline-block mr-0 group-hover:mr-3 transition-all duration-300" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Playlist
              </span>
          </h2>
        <div className="overflow-y-auto flex-grow">
          {videoList.map((video) => {
            const isSelected = video.file === currentVideo;
            return (
              <div
                key={video.file}
                onClick={() => handleSelectVideo(video.file)}
                className={`flex items-center p-3 rounded-lg cursor-pointer my-1 transition-colors duration-200 truncate ${
                  isSelected ? "bg-[#ff0050]" : "hover:bg-[#282828]"
                }`}
              >
                <img
                  src={video.icon}
                  alt={video.title}
                  className={`w-8 h-8 rounded-md object-contain bg-black flex-shrink-0 mr-4 ${
                    isSelected ? "border-2 border-white" : ""
                  }`}
                />
                <span className="font-medium capitalize opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {video.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#212121] rounded-r-[20px] p-[25px] w-[350px] h-[580px] shadow-lg shadow-black/50 flex flex-col items-center">
        <div className="w-full max-w-[300px] h-[168px] rounded-[10px] overflow-hidden mb-[25px] relative bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onClick={playPause}
            playsInline
          />
          {!isVideoReady && !error && (
            <div className="absolute inset-0 flex justify-center items-center text-white bg-black bg-opacity-70">
              Carregando vídeo...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex justify-center items-center text-red-500 font-bold bg-black bg-opacity-70">
              {error}
            </div>
          )}
        </div>

        <div className="text-center mb-[25px] h-20">
          <h2 className="text-[24px] font-bold text-white capitalize">{videoTitle}</h2>
          <p className="text-[16px] text-[#b0b0b0] mt-[5px]">Vídeo Oficial</p>
        </div>

        <div className="flex items-center w-full mb-[20px]">
          <span className="text-[14px] text-[#b0b0b0] w-[40px] text-center">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressClick}
            className="flex-grow mx-[10px] flex items-center h-[20px] cursor-pointer group"
          >
            <div className="w-full h-[4px] bg-[#333] rounded-[2px] relative group-hover:h-[6px] transition-all duration-200">
              <div
                id="progressBar"
                className="h-full bg-[#e0e0e0] rounded-[2px]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[14px] text-[#b0b0b0] w-[40px] text-center">{formatTime(duration)}</span>
        </div>

        <div className="flex justify-between items-center w-full max-w-[280px] mx-auto">
          <FaBackward
            onClick={seekBackward}
            className="text-[24px] text-[#b0b0b0] cursor-pointer hover:text-white transition-colors"
          />
          <div
            onClick={playPause}
            className="w-[60px] h-[60px] bg-[#ff0050] rounded-full flex justify-center items-center cursor-pointer shadow-xl shadow-red-500/40 mx-[20px] transform hover:scale-105 transition-transform"
          >
            {playing ? (
              <FaPause className="text-[28px] text-white ml-0" />
            ) : (
              <FaPlay className="text-[28px] text-white ml-[4px]" />
            )}
          </div>
          <FaForward
            onClick={seekForward}
            className="text-[24px] text-[#b0b0b0] cursor-pointer hover:text-white transition-colors"
          />
          <div className="group relative flex items-center p-2 -m-2">
            <div onClick={toggleMute} className="cursor-pointer">
              {isMuted || volume === 0 ? (
                <FaVolumeMute className="text-[24px] text-[#b0b0b0] group-hover:text-white transition-colors" />
              ) : (
                <FaVolumeUp className="text-[24px] text-[#b0b0b0] group-hover:text-white transition-colors" />
              )}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 invisible opacity-0 group-hover:visible group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300">
              <div className="p-3 bg-[#282828] border border-solid border-[#404040] rounded-xl shadow-lg">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-24 w-2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                  style={{ writingMode: "vertical-lr", direction: "rtl" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}