import { useRef, useState } from "react";
import { Camera, Download, X } from "lucide-react";
import { CTAButton } from "./CTAButton";

interface GymStoryGeneratorProps {
  metrics: {
    completedSets: number;
    totalSets: number;
    completedWorkouts: number;
    totalWorkouts: number;
    totalTime: string;
  };
  userName: string;
  gymName?: string | null; // <--- Nuevo campo opcional
  gymLogo?: string | null; // <--- Nuevo campo opcional
}

export function GymStoryGenerator({ metrics, userName, gymName, gymLogo }: GymStoryGeneratorProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        generateStory(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStory = async (imageUrl: string) => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Tamaño para historia de Instagram (9:16)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Cargar la imagen PRINCIPAL (Foto del usuario)
    const img = new Image();
    img.crossOrigin = "anonymous"; // Importante para poder descargar después
    
    img.onload = () => {
      // 1. Fondo degradado
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#1a1a1a");
      gradient.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Calcular dimensiones de la foto para mantener proporción
      const imgAspect = img.width / img.height;
      const targetHeight = height * 0.55; // 55% del alto
      let imgWidth = targetHeight * imgAspect;
      let imgHeight = targetHeight;
      
      if (imgWidth > width) {
        imgWidth = width;
        imgHeight = width / imgAspect;
      }

      const imgX = (width - imgWidth) / 2;
      const imgY = 120;

      // 3. Sombra de la foto
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;

      // 4. Dibujar foto con bordes redondeados
      ctx.save();
      const radius = 32;
      ctx.beginPath();
      ctx.moveTo(imgX + radius, imgY);
      ctx.lineTo(imgX + imgWidth - radius, imgY);
      ctx.quadraticCurveTo(imgX + imgWidth, imgY, imgX + imgWidth, imgY + radius);
      ctx.lineTo(imgX + imgWidth, imgY + imgHeight - radius);
      ctx.quadraticCurveTo(imgX + imgWidth, imgY + imgHeight, imgX + imgWidth - radius, imgY + imgHeight);
      ctx.lineTo(imgX + radius, imgY + imgHeight);
      ctx.quadraticCurveTo(imgX, imgY + imgHeight, imgX, imgY + imgHeight - radius);
      ctx.lineTo(imgX, imgY + radius);
      ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
      ctx.restore();

      // Resetear sombra
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // 5. Área de métricas
      const metricsY = imgY + imgHeight + 80;
      const metricsHeight = 340;
      
      // Fondo de métricas
      const metricsGradient = ctx.createLinearGradient(0, metricsY, 0, metricsY + metricsHeight);
      metricsGradient.addColorStop(0, "rgba(91, 44, 145, 0.15)");
      metricsGradient.addColorStop(1, "rgba(91, 44, 145, 0.05)");
      ctx.fillStyle = metricsGradient;
      
      const metricsX = 80;
      const metricsWidth = width - 160;
      ctx.beginPath();
      ctx.roundRect(metricsX, metricsY, metricsWidth, metricsHeight, 24);
      ctx.fill();

      // Borde métricas
      ctx.strokeStyle = "rgba(91, 44, 145, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Título "HOY EN EL GYM"
      ctx.fillStyle = "#FF6B35";
      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HOY EN EL GYM", width / 2, metricsY + 80);

      // Tarjetas de Métricas
      const cardY = metricsY + 140;
      const cardWidth = (metricsWidth - 40) / 2;
      const cardHeight = 140;
      const cardGap = 40;

      // Card 1: Series
      const card1X = metricsX + 20;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(card1X, cardY, cardWidth, cardHeight, 16);
      ctx.fill();
      
      ctx.fillStyle = "#9ca3af";
      ctx.font = "500 32px system-ui, -apple-system, sans-serif";
      ctx.fillText("SERIES", card1X + cardWidth / 2, cardY + 45);
      
      ctx.fillStyle = "#5B2C91";
      ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${metrics.completedSets}/${metrics.totalSets}`, card1X + cardWidth / 2, cardY + 115);

      // Card 2: Workouts
      const card2X = card1X + cardWidth + cardGap;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(card2X, cardY, cardWidth, cardHeight, 16);
      ctx.fill();
      
      ctx.fillStyle = "#9ca3af";
      ctx.font = "500 32px system-ui, -apple-system, sans-serif";
      ctx.fillText("WORKOUTS", card2X + cardWidth / 2, cardY + 45);
      
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${metrics.completedWorkouts}/${metrics.totalWorkouts}`, card2X + cardWidth / 2, cardY + 115);

      // Nombre del usuario
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 48px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(userName.toUpperCase(), width / 2, height - 280);

      // --- LOGICA DEL BRANDING (Logo del Gym) ---
      
      const drawFooter = () => {
        // Línea decorativa final
        ctx.strokeStyle = "#FF6B35";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 120, height - 100);
        ctx.lineTo(width / 2 + 120, height - 100);
        ctx.stroke();

        // Guardar imagen final
        const storyUrl = canvas.toDataURL("image/png");
        setGeneratedStory(storyUrl);
        setIsGenerating(false);
      };

      const gymDisplayName = gymName || "Spotter GYM";

      if (gymLogo) {
        // Si hay logo, lo cargamos
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = gymLogo;

        logoImg.onload = () => {
          const logoSize = 120;
          const logoX = (width / 2) - (logoSize / 2);
          const logoY = height - 250;

          // Dibujar logo circular
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, logoY + (logoSize/2), logoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();

          // Dibujar nombre del gym DEBAJO del logo
          ctx.fillStyle = "#5B2C91";
          ctx.font = "bold 60px system-ui, -apple-system, sans-serif";
          ctx.fillText(gymDisplayName, width / 2, logoY + logoSize + 60);

          drawFooter();
        };

        // Si falla la carga del logo, dibujamos solo texto
        logoImg.onerror = () => {
            ctx.fillStyle = "#5B2C91";
            ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
            ctx.fillText(gymDisplayName, width / 2, height - 160);
            drawFooter();
        }
      } else {
        // Si no hay logo, solo texto (como antes)
        ctx.fillStyle = "#5B2C91";
        ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
        ctx.fillText(gymDisplayName, width / 2, height - 160);
        drawFooter();
      }
    };

    img.src = imageUrl;
  };

  const handleDownload = () => {
    if (generatedStory) {
      const link = document.createElement("a");
      link.download = `spotter-gym-${Date.now()}.png`;
      link.href = generatedStory;
      link.click();
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    setGeneratedStory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <CTAButton
        variant="accent"
        icon={Camera}
        onClick={handleCameraClick}
        fullWidth
      >
        Crear historia del gym
      </CTAButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
      />

      <canvas ref={canvasRef} className="hidden" />

      {generatedStory && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-md w-full space-y-4">
            <div className="bg-black rounded-2xl overflow-hidden border-2 border-primary/30">
              <img
                src={generatedStory}
                alt="Historia generada"
                className="w-full h-auto"
              />
            </div>

            <CTAButton
              variant="accent"
              icon={Download}
              onClick={handleDownload}
              fullWidth
              disabled={isGenerating}
            >
              {isGenerating ? "Generando..." : "Descargar historia"}
            </CTAButton>

            <p className="text-center text-[13px] text-gray-400">
              Guardá la imagen y compartila en tus historias de Instagram
            </p>
          </div>
        </div>
      )}
    </>
  );
}