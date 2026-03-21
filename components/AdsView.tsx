
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Play, FastForward, CheckCircle2, Tv, Loader2, Coins, Sparkles, AlertCircle } from 'lucide-react';

interface AdsViewProps {
  onBack: () => void;
}

export const AdsView: React.FC<AdsViewProps> = ({ onBack }) => {
  const { showToast, addBalance, rewardSettings } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Consumir configurações do contexto
  const AD_DURATION = rewardSettings.adDuration;
  const REWARD_AMOUNT = rewardSettings.rewardAmount;

  useEffect(() => {
    let timer: number;
    if (isPlaying && progress < 100) {
      timer = window.setInterval(() => {
        setProgress(prev => {
          const next = prev + (100 / (AD_DURATION * 10));
          if (next >= 100) {
            clearInterval(timer);
            setIsFinished(true);
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, progress, AD_DURATION]);

  const handleStartAd = () => {
    if (!rewardSettings.isActive) {
      showToast("A Sala de Recompensas está em manutenção no momento.", "error");
      return;
    }
    setIsPlaying(true);
    setProgress(0);
    setIsFinished(false);
    showToast("Anúncio iniciado. Aguarde a conclusão para receber a recompensa.", "info");
  };

  const handleClaimReward = () => {
    addBalance(REWARD_AMOUNT);
    showToast(`Parabéns! Você recebeu R$ ${REWARD_AMOUNT.toFixed(2)} de recompensa.`, "success");
    onBack();
  };

  if (!rewardSettings.isActive) {
    return (
      <div className="p-8 md:p-12 animate-fade-in max-w-5xl mx-auto h-full flex flex-col items-center justify-center">
         <div className="text-center">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Sistema Indisponível</h2>
            <p className="text-gray-400 max-w-sm mx-auto mb-10 text-sm leading-relaxed font-medium">
               A Sala de Recompensas foi temporariamente desativada pela administração para manutenção dos servidores de publicidade.
            </p>
            <button onClick={onBack} className="bg-white/5 text-gray-400 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-transparent hover:text-white transition-all">
               Voltar para a Loja
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 animate-fade-in max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase flex items-center gap-4">
              <Tv className="text-steam-highlight w-10 h-10" /> {rewardSettings.adTitle}
            </h1>
            <p className="text-gray-400 font-medium italic opacity-60 uppercase text-[10px] tracking-widest">
              Sala de Recompensas Master • Sincronia Monetária Ativa
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        {!isPlaying && !isFinished ? (
          <div className="text-center animate-scale-in">
            <div className="w-32 h-32 bg-steam-highlight/10 rounded-[40px] flex items-center justify-center border border-steam-highlight/20 mx-auto mb-10 shadow-4xl group hover:scale-110 transition-transform cursor-pointer" onClick={handleStartAd}>
              <Play className="w-16 h-16 text-steam-highlight fill-current" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Pronto para a Transmissão?</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-10 text-sm leading-relaxed font-medium italic">
              {rewardSettings.adDescription} Cada vídeo de {AD_DURATION}s garante <span className="text-steam-highlight font-black">R$ {REWARD_AMOUNT.toFixed(2)}</span> direto na sua conta.
            </p>
            <button 
              onClick={handleStartAd}
              className="bg-steam-highlight text-steam-dark px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
            >
              Iniciar Vídeo de Recompensa
            </button>
          </div>
        ) : isPlaying ? (
          <div className="w-full max-w-3xl animate-scale-in">
             <div className="aspect-video bg-black rounded-[40px] border border-transparent relative overflow-hidden shadow-5xl mb-12 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-purple-900/20 animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-steam-highlight animate-spin relative z-10" />
                <div className="mt-6 text-center relative z-10">
                   <div className="text-[10px] text-steam-highlight font-black uppercase tracking-[0.4em] mb-2">Processando Transmissão</div>
                   <div className="text-xl font-black text-white uppercase tracking-tighter italic">Anúncio em Exibição...</div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5">
                   <div className="h-full bg-steam-highlight shadow-[0_0_15px_rgba(102,192,244,0.5)] transition-all duration-100" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-transparent text-[10px] font-black text-white flex items-center gap-2">
                   <FastForward className="w-4 h-4 text-steam-highlight" />
                   {Math.ceil(AD_DURATION * (1 - progress/100))}s restantes
                </div>
             </div>

             <div className="flex flex-col items-center">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center">
                   Não feche esta página até que a barra de progresso esteja completa.
                </p>
             </div>
          </div>
        ) : (
          <div className="text-center animate-bounce-in">
             <div className="w-32 h-32 bg-steam-green/10 rounded-[40px] flex items-center justify-center border border-steam-green/20 mx-auto mb-10 shadow-4xl">
               <CheckCircle2 className="w-16 h-16 text-steam-green" />
             </div>
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Recompensa Desbloqueada!</h2>
             <p className="text-gray-500 max-w-sm mx-auto mb-10 text-sm leading-relaxed font-medium italic">
               Sua sincronia neural foi bem-sucedida. O saldo de <span className="text-steam-green font-black">R$ {REWARD_AMOUNT.toFixed(2)}</span> está disponível.
             </p>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <button 
                 onClick={handleClaimReward}
                 className="bg-steam-green text-steam-dark px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white transition-all shadow-2xl shadow-green-600/20 active:scale-95 flex items-center gap-3"
               >
                 <Coins className="w-4 h-4" /> Resgatar Recompensa
               </button>
               <button 
                 onClick={handleStartAd}
                 className="bg-white/5 text-gray-400 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:text-white transition-all border border-transparent flex items-center gap-3"
               >
                 <FastForward className="w-4 h-4" /> Ver Mais Um
               </button>
             </div>
          </div>
        )}
      </div>

      <div className="mt-auto py-10 border-t border-transparent flex items-center justify-center gap-12 opacity-40">
         <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Sincronia Segura</span>
         </div>
         <div className="flex items-center gap-3">
            <Sparkles className="text-steam-highlight w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Impulso de Prestígio</span>
         </div>
         <div className="flex items-center gap-3">
            <Tv className="text-blue-500 w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Publicidade Master</span>
         </div>
      </div>
    </div>
  );
};
