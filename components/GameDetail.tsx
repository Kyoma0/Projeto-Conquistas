
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Game, AchievementStatus, Difficulty, Achievement, Content, ContentType } from '../types';
import { useApp } from '../context/AppContext';
import { Trophy, Video, Image as ImageIcon, CheckCircle2, EyeOff, BookOpen, Lightbulb, X, PlayCircle, Camera, Edit3, Plus, Save, Trash2, Clock, Lock, ArrowUpRight, Target, Info, MessageSquare, History, AlertTriangle, Eye, Settings, ChevronUp, ChevronDown, Layout, PlusCircle, AlertCircle, ListChecks, Settings2, Send, Maximize, AlignLeft, AlignCenter, AlignRight, PanelTop, PanelBottom, Library, Heart, Scan, Monitor, ShieldCheck, Zap, RefreshCw, Layers, Loader2 } from 'lucide-react';
import { SteamValidator } from './SteamValidator';
import { RenderAchIcon } from './AdminPanel';
import { AIAssistant } from './AIAssistant';

interface GameDetailProps {
  game: Game;
  onNavigateProfile: (userId: string) => void;
}

const getDifficultyColor = (diff: Difficulty) => {
  switch (diff) {
    case 'Fácil': return 'text-green-400';
    case 'Médio': return 'text-yellow-400';
    case 'Difícil': return 'text-orange-400';
    case 'Extremo': return 'text-red-500 font-bold';
    default: return 'text-gray-400';
  }
};

// --- COMPONENTE DE BLOCO DO BUILDER (PÁGINA RICA) ---
const BuilderBlock: React.FC<{ 
  content: Content, 
  isEditMode: boolean,
  onMove: (dir: 'up' | 'down') => void,
  onDelete: (id: string) => void,
  onUpdate: (content: Content) => void
}> = ({ content, isEditMode, onMove, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<Content>(content);

  const handleSave = () => {
    onUpdate({ ...tempValue, updatedAt: new Date().toISOString() });
    setIsEditing(false);
  };

  const widthClasses = {
    '25%': 'md:w-1/4',
    '50%': 'md:w-1/2',
    '75%': 'md:w-3/4',
    '100%': 'w-full',
  };

  if (isEditing && isEditMode) {
    return (
      <div className="bg-[#1e232b] p-6 rounded-xl border-2 border-transparent shadow-2xl mb-8 animate-scale-in relative z-50 w-full">
         <div className="flex justify-between items-center mb-6 border-b border-transparent pb-4">
            <span className="text-xs font-black text-steam-highlight uppercase tracking-[0.2em]">Editor de Bloco: {content.type.toUpperCase()}</span>
            <div className="flex gap-4">
               <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-widest">Descartar</button>
               <button type="button" onClick={handleSave} className="bg-steam-highlight text-steam-dark px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-xl shadow-blue-500/20"><Save className="w-3.5 h-3.5"/> Aplicar Mudanças</button>
            </div>
         </div>
         
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">Título da Seção</label>
                <input className="w-full bg-black/40 border border-transparent rounded-lg p-3 text-white font-bold outline-none focus:border-steam-highlight text-sm" value={tempValue.title} onChange={e => setTempValue({...tempValue, title: e.target.value})} placeholder="Ex: Guia de Combate" />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">Largura</label>
                  <select className="w-full bg-black/40 border border-transparent rounded-lg p-3 text-white text-xs outline-none focus:border-steam-highlight" value={tempValue.width} onChange={e => setTempValue({...tempValue, width: e.target.value as any})}>
                    <option value="25%">25% (Pequeno)</option>
                    <option value="50%">50% (Médio)</option>
                    <option value="75%">75% (Grande)</option>
                    <option value="100%">100% (Largura Total)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">Alinhamento / Layout</label>
                  <select className="w-full bg-black/40 border border-transparent rounded-lg p-3 text-white text-xs outline-none focus:border-steam-highlight" value={tempValue.alignment} onChange={e => setTempValue({...tempValue, alignment: e.target.value as any})}>
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                    <option value="top">Mídia Acima</option>
                    <option value="bottom">Mídia Abaixo</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">{content.type === 'text' ? 'Conteúdo do Texto' : 'URL da Mídia (YouTube/Link)'}</label>
              <textarea className="w-full bg-black/40 border border-transparent rounded-lg p-4 text-white text-sm h-32 resize-none focus:border-steam-highlight outline-none font-sans leading-relaxed" value={tempValue.content} onChange={e => setTempValue({...tempValue, content: e.target.value})} placeholder="Insira o texto ou URL..." />
            </div>

            {(content.type === 'image' || content.type === 'video') && (
              <div>
                <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">Contexto / Sinopse (18px)</label>
                <textarea className="w-full bg-black/40 border border-transparent rounded-lg p-4 text-white text-lg h-24 resize-none focus:border-steam-highlight outline-none font-sans leading-relaxed italic" value={tempValue.synopsis} onChange={e => setTempValue({...tempValue, synopsis: e.target.value})} placeholder="Descreva o contexto desta mídia..." />
              </div>
            )}
         </div>
      </div>
    );
  }

  const renderMediaContent = () => {
    const isHorizontal = content.alignment === 'left' || content.alignment === 'right';
    const isReversed = content.alignment === 'right';

    return (
      <div className={`flex flex-col gap-6 ${isHorizontal ? (isReversed ? 'md:flex-row-reverse' : 'md:flex-row') : 'flex-col'} items-start`}>
        <div className={`${isHorizontal ? 'md:w-1/2 w-full' : 'w-full'} shrink-0`}>
          {content.type === 'video' ? (
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-transparent">
              <iframe width="100%" height="100%" src={content.content} title={content.title} frameBorder="0" allowFullScreen></iframe>
            </div>
          ) : (
            <img src={content.content} alt={content.title} className="w-full rounded-xl shadow-2xl border border-transparent object-cover" />
          )}
        </div>
        <div className="flex-1 space-y-4">
          <h4 className="text-[10px] font-black text-steam-highlight uppercase tracking-[0.2em]">{content.title}</h4>
          <p className="text-lg text-gray-200 font-medium leading-relaxed italic opacity-90">{content.synopsis}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`group relative mb-8 animate-fade-in ${widthClasses[content.width || '100%']} ${content.alignment === 'center' ? 'mx-auto' : ''}`}>
      {/* CONTROLES INLINE */}
      {isEditMode && (
        <div className="absolute top-3 right-3 flex flex-row gap-2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove('up'); }} className="p-2 bg-steam-dark/95 text-white rounded-lg border border-transparent hover:bg-steam-highlight hover:text-steam-dark shadow-2xl" title="Mover para Cima"><ChevronUp className="w-4 h-4" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove('down'); }} className="p-2 bg-steam-dark/95 text-white rounded-lg border border-transparent hover:bg-steam-highlight hover:text-steam-dark shadow-2xl" title="Mover para Baixo"><ChevronDown className="w-4 h-4" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-2 bg-steam-dark/95 text-white rounded-lg border border-transparent hover:bg-steam-highlight hover:text-steam-dark shadow-2xl" title="Editar Bloco"><Edit3 className="w-4 h-4" /></button>
          <button type="button" onClick={(e) => { 
            e.stopPropagation(); 
            if(window.confirm('Excluir este bloco permanentemente?')) {
              onDelete(content.id); 
            }
          }} className="p-2 bg-red-900/80 text-white rounded-lg border border-transparent hover:bg-red-600 shadow-2xl" title="Excluir Bloco"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}

      <div className={`transition-all duration-300 ${isEditMode ? 'ring-2 ring-steam-highlight/20 rounded-2xl p-2' : ''}`}>
         {content.type === 'text' && (
            <div className={`p-6 bg-[#0d0f13] rounded-2xl border border-transparent shadow-2xl ${content.alignment === 'center' ? 'text-center' : content.alignment === 'right' ? 'text-right' : 'text-left'}`}>
               <h4 className="font-black text-steam-highlight mb-4 uppercase text-[11px] tracking-[0.3em]">{content.title}</h4>
               <div className="text-base text-gray-300 whitespace-pre-wrap leading-loose font-sans opacity-90">{content.content}</div>
            </div>
         )}
         
         {(content.type === 'image' || content.type === 'video') && (
            <div className={`p-6 bg-[#0d0f13]/40 rounded-2xl shadow-3xl border border-transparent`}>
               {renderMediaContent()}
            </div>
         )}

         {content.type === 'alert' && (
            <div className="p-6 bg-red-600/10 rounded-2xl border border-transparent flex items-start gap-4 shadow-xl">
               <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
               <div className="flex-1">
                 <h4 className="font-black text-red-500 mb-2 uppercase text-[11px] tracking-[0.3em]">{content.title}</h4>
                 <div className="text-sm text-red-100 font-bold leading-relaxed">{content.content}</div>
               </div>
            </div>
         )}

         {content.type === 'list' && (
            <div className="p-6 bg-white/5 rounded-2xl border border-transparent shadow-xl">
               <h4 className="font-black text-white mb-4 uppercase text-[11px] tracking-[0.3em]">{content.title}</h4>
               <ul className="space-y-3">
                  {content.content.split('\n').map((item, i) => (
                    <li key={i} className="flex gap-4 text-sm text-gray-400 font-medium">
                       <span className="text-steam-highlight font-black">#</span> {item}
                    </li>
                  ))}
               </ul>
            </div>
         )}
      </div>
    </div>
  );
};

// --- MODAL DE CONQUISTA COM PAGE BUILDER INTEGRADO ---
const AchievementModal: React.FC<{ 
  achievement: Achievement, 
  game: Game,
  onClose: () => void,
  onNavigateProfile: (userId: string) => void
}> = ({ achievement, game, onClose, onNavigateProfile }) => {
  const { contents, userProgress, currentUser, feedbacks, addFeedback, deleteFeedback, addContent, updateContent, deleteContent, updateAchievement } = useApp();
  
  const achBlocks = useMemo(() => contents.filter(c => c.achievementId === achievement.id).sort((a, b) => (a.order || 0) - (b.order || 0)), [contents, achievement.id]);
  const achFeedbacks = useMemo(() => feedbacks.filter(f => f.achievementId === achievement.id), [feedbacks, achievement.id]);
  
  const userAchData = userProgress[achievement.id];
  const isUnlocked = userAchData?.status === AchievementStatus.COMPLETED;
  const isPending = userAchData?.status === AchievementStatus.IN_ANALYSIS;
  
  const [editMode, setEditMode] = useState(false);
  const [showBaseSettings, setShowBaseSettings] = useState(false);
  const [localMetadata, setLocalMetadata] = useState(achievement);
  const [activeAchTab, setActiveAchTab] = useState('GUIA');
  const [newComment, setNewComment] = useState('');

  const handleSaveBase = (e: React.FormEvent) => {
    e.preventDefault();
    updateAchievement(localMetadata);
    setShowBaseSettings(false);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addFeedback(achievement.id, newComment);
    setNewComment('');
  };

  const handleAddBlock = (type: ContentType, order: number) => {
    const uniqueId = `blk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBlock: Content = {
      id: uniqueId,
      gameId: game.id,
      achievementId: achievement.id,
      category: activeAchTab,
      title: 'Nova Seção',
      type: type,
      content: type === 'text' ? 'Digite aqui seu guia detalhado...' : 'https://youtube.com/embed/dQw4w9WgXcQ',
      synopsis: (type === 'image' || type === 'video') ? 'Explicação rápida do contexto desta mídia.' : undefined,
      author: currentUser?.name || 'Admin',
      order: order,
      width: '100%',
      alignment: 'top',
      updatedAt: new Date().toISOString()
    };
    addContent(newBlock);
  };

  const tabBlocks = achBlocks.filter(b => b.category === activeAchTab);

  const reorderBlock = (index: number, direction: 'up' | 'down') => {
      const list = [...tabBlocks];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return;
      
      const tempOrder = list[index].order || 0;
      list[index].order = list[targetIndex].order || 0;
      list[targetIndex].order = tempOrder;
      
      updateContent(list[index]);
      updateContent(list[targetIndex]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-xl overflow-y-auto">
        <div className="bg-[#1b2838] w-full max-w-6xl rounded-3xl border border-transparent shadow-5xl relative flex flex-col max-h-[90vh] animate-scale-in overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#171d25] p-8 flex items-center gap-8 border-b border-transparent relative">
           <RenderAchIcon icon={achievement.icon} className={`w-24 h-24 shrink-0 transition-all duration-1000
               ${isUnlocked ? 'grayscale-0 shadow-[0_0_20px_rgba(102,192,244,0.3)]' : (isPending ? 'grayscale-0' : 'grayscale opacity-30')}
           `} />
           <div className="flex-1">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">{achievement.name}</h2>
              <div className="flex items-center gap-4">
                 <span className={`px-4 py-1.5 rounded-full bg-black/40 border border-transparent text-[10px] font-black uppercase tracking-widest ${getDifficultyColor(achievement.difficulty)}`}>{achievement.difficulty}</span>
                 <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-transparent text-blue-300 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10">{achievement.xp} XP DE CAÇA</span>
                 {currentUser?.isAdmin && (
                    <button type="button" onClick={() => setShowBaseSettings(true)} className="p-2 bg-white/5 hover:bg-steam-highlight hover:text-steam-dark rounded-xl transition-all shadow-xl">
                      <Settings className="w-5 h-5" />
                    </button>
                 )}
              </div>
           </div>
           <button type="button" onClick={onClose} className="p-3 hover:bg-red-500/20 rounded-full transition-all group absolute top-6 right-6"><X className="w-8 h-8 text-gray-500 group-hover:text-red-500" /></button>
        </div>

        {/* ABAS */}
        <div className="bg-[#171d25] px-8 flex gap-10 border-b border-transparent shrink-0 overflow-x-auto custom-scrollbar items-center justify-between">
          <div className="flex gap-10">
            {['DETALHES', 'GUIA', 'IMAGENS', 'VÍDEOS', 'ATUALIZAÇÕES'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveAchTab(tab)}
                className={`pb-5 pt-5 text-[11px] font-black uppercase tracking-[0.3em] relative transition-all ${activeAchTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
                {activeAchTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-steam-highlight rounded-full"></div>}
              </button>
            ))}
          </div>
          {currentUser?.isAdmin && (
             <button type="button" onClick={() => setEditMode(!editMode)} className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-2xl ${editMode ? 'bg-green-600 text-white animate-pulse' : 'bg-steam-highlight text-steam-dark hover:scale-105'}`}>
                {editMode ? <Save className="w-4 h-4"/> : <Edit3 className="w-4 h-4"/>}
                {editMode ? 'SALVAR LAYOUT' : 'MODO BUILDER'}
             </button>
          )}
        </div>

        {/* CONTEÚDO RÍCO */}
        <div className="p-10 overflow-y-auto flex-1 bg-[#0d0f13] custom-scrollbar">
           <div className="max-w-4xl mx-auto w-full pb-20">
              {tabBlocks.map((block, idx) => (
                  <BuilderBlock 
                    key={block.id} 
                    content={block} 
                    isEditMode={editMode} 
                    onMove={(dir) => reorderBlock(idx, dir)}
                    onDelete={deleteContent}
                    onUpdate={updateContent}
                  />
              ))}

              {tabBlocks.length === 0 && !editMode && (
                <div className="py-40 flex flex-col items-center justify-center text-center opacity-20 group">
                    <div className="p-10 rounded-full bg-white/5 border-2 border-dashed border-transparent group-hover:scale-110 transition-transform">
                      <Layout className="w-20 h-20 text-gray-400" />
                    </div>
                    <p className="mt-8 text-sm font-black uppercase tracking-[0.4em] text-gray-400">Página em Construção</p>
                </div>
              )}

              {editMode && currentUser?.isAdmin && (
                  <div className="relative z-20 my-12 border-2 border-dashed border-transparent rounded-2xl hover:border-steam-highlight/40 transition-all p-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { type: 'text', label: 'Texto Guia', icon: <AlignLeft className="w-4 h-4" /> },
                          { type: 'image', label: 'Imagem', icon: <ImageIcon className="w-4 h-4" /> },
                          { type: 'video', label: 'Vídeo', icon: <Video className="w-4 h-4" /> },
                          { type: 'alert', label: 'Aviso', icon: <AlertTriangle className="w-4 h-4" /> },
                          { type: 'list', label: 'Lista', icon: <ListChecks className="w-4 h-4" /> }
                        ].map(item => (
                            <button key={item.type} onClick={() => handleAddBlock(item.type as ContentType, achBlocks.length)} className="p-4 rounded-xl hover:bg-steam-highlight hover:text-steam-dark flex flex-col items-center gap-2 transition-all text-gray-400 text-[10px] font-black uppercase tracking-widest border border-transparent">
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                      </div>
                  </div>
              )}

              {/* FEEDBACK (SÓ NO GUIA) */}
              {activeAchTab === 'GUIA' && !editMode && (
                  <div className="mt-20 border-t border-transparent pt-12 animate-fade-in">
                     <div className="flex items-center gap-3 mb-10">
                        <MessageSquare className="w-6 h-6 text-steam-highlight" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Mural da Comunidade</h3>
                     </div>

                     <form onSubmit={handleSendComment} className="flex gap-5 mb-12">
                        <img src={currentUser?.avatar} className="w-12 h-12 rounded-xl border-2 border-transparent shrink-0 shadow-xl" alt="Me" />
                        <div className="flex-1 relative">
                           <textarea 
                             className="w-full bg-[#171a21] border border-transparent rounded-2xl p-5 text-white text-sm focus:border-steam-highlight outline-none resize-none h-24 font-sans pr-16 shadow-inner"
                             placeholder="Dê uma dica ou tire uma dúvida sobre esta conquista..."
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                           />
                           <button type="submit" className="absolute bottom-4 right-4 p-3 bg-steam-highlight text-steam-dark rounded-xl hover:scale-110 transition-all shadow-xl"><Send className="w-5 h-5" /></button>
                        </div>
                     </form>

                     <div className="space-y-6">
                        {achFeedbacks.length > 0 ? achFeedbacks.map(fb => (
                           <div key={fb.id} className="flex gap-5 p-6 bg-white/5 rounded-2xl border border-transparent group transition-all relative hover:bg-white/[0.08]">
                              <img 
                                src={fb.userAvatar} 
                                className="w-12 h-12 rounded-xl border border-transparent shrink-0 object-cover cursor-pointer hover:scale-105 transition-transform" 
                                alt={fb.userName} 
                                onClick={() => onNavigateProfile(fb.userId)}
                              />
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-3">
                                    <div 
                                      className="font-black text-steam-highlight text-xs uppercase tracking-[0.2em] cursor-pointer hover:underline"
                                      onClick={() => onNavigateProfile(fb.userId)}
                                    >
                                      {fb.userName}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{new Date(fb.timestamp).toLocaleDateString()}</div>
                                        {currentUser?.isAdmin && (
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.stopPropagation();
                                                    if(window.confirm('Excluir este feedback permanentemente?')) {
                                                        deleteFeedback(fb.id); 
                                                    }
                                                }} 
                                                className="text-red-500 hover:text-red-400 p-1 opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </div>
                                 </div>
                                 <p className="text-gray-300 text-sm font-medium leading-relaxed break-words opacity-90 italic">"{fb.comment}"</p>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-10 opacity-10 italic text-[10px] uppercase tracking-widest">Aguardando as primeiras dicas...</div>
                        )}
                     </div>
                  </div>
              )}
           </div>
        </div>
      </div>

      {showBaseSettings && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] p-4 backdrop-blur-2xl animate-fade-in">
            <div className="bg-[#1b2838] p-10 rounded-3xl w-full max-w-lg border border-transparent shadow-5xl">
               <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter border-b border-transparent pb-4">Configurações Gerais</h3>
               <form onSubmit={handleSaveBase} className="space-y-6">
                  <div>
                     <label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Nome do Troféu</label>
                     <input 
                        className="w-full bg-[#171a21] border border-transparent rounded-xl p-4 text-white font-bold outline-none focus:border-steam-highlight" 
                        value={localMetadata.name} 
                        onChange={e => setLocalMetadata({...localMetadata, name: e.target.value})} 
                     />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Descrição</label>
                     <textarea 
                        className="w-full bg-[#171a21] border border-transparent rounded-xl p-4 text-white text-sm h-24 resize-none focus:border-steam-highlight" 
                        value={localMetadata.description} 
                        onChange={e => setLocalMetadata({...localMetadata, description: e.target.value})} 
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Dificuldade</label>
                        <select 
                           className="w-full bg-[#171a21] border border-transparent rounded-xl p-4 text-white text-xs" 
                           value={localMetadata.difficulty} 
                           onChange={e => setLocalMetadata({...localMetadata, difficulty: e.target.value as any})}
                        >
                           <option value="Fácil">Fácil</option>
                           <option value="Médio">Médio</option>
                           <option value="Difícil">Difícil</option>
                           <option value="Extremo">Extremo</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">XP</label>
                        <input 
                           type="number" 
                           className="w-full bg-[#171a21] border border-transparent rounded-xl p-4 text-white font-bold" 
                           value={localMetadata.xp} 
                           onChange={e => setLocalMetadata({...localMetadata, xp: Number(e.target.value)})} 
                        />
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setShowBaseSettings(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-gray-400 font-black uppercase tracking-widest text-[10px]">Cancelar</button>
                     <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-steam-highlight text-steam-dark font-black uppercase tracking-widest text-[10px]">Salvar Alterações</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
    </>
  );
};

// --- COMPONENTE PRINCIPAL DETALHE DO JOGO ---
export const GameDetail: React.FC<GameDetailProps> = ({ game, onNavigateProfile }) => {
  const { achievements, contents, userProgress, toggleLibrary, toggleFavorite, currentUser, systemSettings, addContent, updateContent, deleteContent } = useApp();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showValidator, setShowValidator] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'easy' | 'hard'>('default');
  const [activeTab, setActiveTab] = useState<'achievements' | 'extras'>('achievements');
  const [editMode, setEditMode] = useState(false);

  const gameAchievements = useMemo(() => {
    const list = achievements.filter(a => a.gameId === game.id);
    
    const difficultyOrder: Record<Difficulty, number> = {
      'Fácil': 1,
      'Médio': 2,
      'Difícil': 3,
      'Extremo': 4
    };

    return [...list].sort((a, b) => {
      if (sortBy === 'default') return a.name.localeCompare(b.name);
      
      const orderA = difficultyOrder[a.difficulty] || 0;
      const orderB = difficultyOrder[b.difficulty] || 0;
      return sortBy === 'easy' ? orderA - orderB : orderB - orderA;
    });
  }, [achievements, game.id, sortBy]);

  const extrasBlocks = useMemo(() => 
    contents.filter(c => c.gameId === game.id && !c.achievementId && c.category === 'EXTRAS')
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [contents, game.id]
  );

  const handleAddExtraBlock = (type: ContentType, order: number) => {
    const uniqueId = `blk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBlock: Content = {
      id: uniqueId,
      gameId: game.id,
      category: 'EXTRAS',
      title: 'Novo Extra',
      type: type,
      content: type === 'text' ? 'Digite aqui seu conteúdo extra...' : 'https://youtube.com/embed/dQw4w9WgXcQ',
      synopsis: (type === 'image' || type === 'video') ? 'Explicação rápida do contexto.' : undefined,
      author: currentUser?.name || 'Admin',
      order: order,
      width: '100%',
      alignment: 'top',
      updatedAt: new Date().toISOString()
    };
    addContent(newBlock);
  };

  const reorderExtraBlock = (index: number, direction: 'up' | 'down') => {
    const list = [...extrasBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    const tempOrder = list[index].order || 0;
    list[index].order = list[targetIndex].order || 0;
    list[targetIndex].order = tempOrder;
    
    updateContent(list[index]);
    updateContent(list[targetIndex]);
  };

  const unlockedCount = useMemo(() => 
    gameAchievements.filter(a => userProgress[a.id]?.status === AchievementStatus.COMPLETED).length,
    [gameAchievements, userProgress]
  );

  const progress = gameAchievements.length > 0 
    ? Math.round((unlockedCount / gameAchievements.length) * 100) 
    : 0;

  const isInLibrary = currentUser?.libraryGameIds.includes(game.id);
  const isFavorite = currentUser?.favoriteGameIds.includes(game.id);

  return (
    <>
      <div className="animate-fade-in pb-20">
      {/* Banner Section */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={game.bannerUrl} 
          className="w-full h-full object-cover scale-105 blur-[2px] opacity-40" 
          alt="Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-steam-base via-steam-base/60 to-transparent"></div>
        
        <div className="absolute inset-0 flex items-end p-8 md:p-12">
           <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 items-end">
              <img 
                src={game.coverUrl} 
                className="w-48 h-72 object-cover rounded-xl shadow-4xl border-2 border-transparent relative z-10" 
                alt={game.title} 
              />
              <div className="flex-1">
                 <div className="flex items-center gap-4 mb-4">
                    <button 
                      onClick={() => toggleLibrary(game.id)}
                      className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-2xl
                        ${isInLibrary ? 'bg-steam-green text-steam-dark' : 'bg-steam-light text-white hover:bg-steam-highlight hover:text-steam-dark'}
                      `}
                    >
                      <Library className="w-4 h-4" />
                      {isInLibrary ? 'Na Biblioteca' : 'Adicionar à Biblioteca'}
                    </button>
                    <button 
                      onClick={() => toggleFavorite(game.id)}
                      className={`p-2.5 rounded-lg transition-all shadow-2xl border
                        ${isFavorite ? 'bg-pink-500/20 border-transparent text-pink-400' : 'bg-white/5 border-transparent text-gray-400 hover:text-white'}
                      `}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                 </div>
                 <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-2">{game.title}</h1>
                 <p className="text-steam-highlight font-black uppercase tracking-[0.4em] text-xs">{game.publisher}</p>
              </div>
              <div className="text-right hidden md:block">
                 <div className="text-6xl font-black text-white mb-1 leading-none">{progress}%</div>
                 <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Conclusão Total</div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Left: Content Area */}
         <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col gap-6 mb-8 border-b border-transparent pb-6">
               <div className="flex items-center justify-between">
                  <div className="flex gap-8">
                    <button 
                      onClick={() => setActiveTab('achievements')}
                      className={`pb-4 text-xl font-black uppercase tracking-tight flex items-center gap-3 transition-all relative ${activeTab === 'achievements' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <Trophy className={activeTab === 'achievements' ? 'text-steam-highlight' : 'text-gray-600'} /> 
                      Conquistas do Jogo
                      {activeTab === 'achievements' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-steam-highlight rounded-full"></div>}
                    </button>
                    {systemSettings.isExtrasEnabled && (
                      <button 
                        onClick={() => setActiveTab('extras')}
                        className={`pb-4 text-xl font-black uppercase tracking-tight flex items-center gap-3 transition-all relative ${activeTab === 'extras' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        <Zap className={activeTab === 'extras' ? 'text-steam-highlight' : 'text-gray-600'} /> 
                        Extras e Ester egg
                        {activeTab === 'extras' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-steam-highlight rounded-full"></div>}
                      </button>
                    )}
                  </div>

                  {activeTab === 'extras' && currentUser?.isAdmin && (
                    <button 
                      onClick={() => setEditMode(!editMode)}
                      className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-2xl ${editMode ? 'bg-green-600 text-white animate-pulse' : 'bg-steam-highlight text-steam-dark hover:scale-105'}`}
                    >
                      {editMode ? <Save className="w-4 h-4"/> : <Edit3 className="w-4 h-4"/>}
                      {editMode ? 'Salvar Layout' : 'Modo Builder'}
                    </button>
                  )}
               </div>

               {activeTab === 'achievements' && (
                 <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-black uppercase tracking-widest">({unlockedCount}/{gameAchievements.length}) Coletadas</span>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2 bg-black/40 border border-transparent rounded-lg px-3 py-1.5">
                        <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-300 outline-none cursor-pointer"
                        >
                          <option value="default">Ordem Padrão</option>
                          <option value="easy">Fácil → Difícil</option>
                          <option value="hard">Difícil → Fácil</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowAI(true)}
                          className="bg-purple-600/20 text-purple-400 border border-purple-500/30 p-2.5 rounded-lg hover:bg-purple-600 hover:text-white transition-all shadow-lg"
                          title="Assistente IA (Lhama)"
                        >
                          <span className="text-xl">🦙</span>
                        </button>
                        <button 
                          onClick={() => setShowValidator(true)}
                          className="bg-steam-highlight text-steam-dark px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:scale-105 transition-all shadow-2xl shadow-blue-500/20"
                        >
                          <Scan className="w-4 h-4" /> Validar via Steam
                        </button>
                        {currentUser?.steamId && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-steam-green/10 border border-steam-green/20 rounded-lg animate-fade-in">
                            <div className="w-2 h-2 bg-steam-green rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black text-steam-green uppercase tracking-widest">Steam Vinculada</span>
                          </div>
                        )}
                      </div>
                    </div>
                 </div>
               )}
            </div>

            {activeTab === 'achievements' ? (
              <div className="grid gap-4">
                 {gameAchievements.map(ach => {
                    const status = userProgress[ach.id]?.status || AchievementStatus.LOCKED;
                    const isUnlocked = status === AchievementStatus.COMPLETED;
                    
                    return (
                      <div 
                        key={ach.id}
                        onClick={() => setSelectedAchievement(ach)}
                        className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-5
                          ${isUnlocked ? 'bg-white/5 border-transparent hover:bg-white/10' : 'bg-black/20 border-transparent hover:border-transparent'}
                        `}
                      >
                        <RenderAchIcon 
                          icon={ach.icon} 
                          className={`w-16 h-16 transition-all duration-500 ${isUnlocked ? 'grayscale-0 shadow-[0_0_15px_rgba(102,192,244,0.3)]' : (userProgress[ach.id]?.status === AchievementStatus.IN_ANALYSIS ? 'grayscale-0' : 'grayscale opacity-30 group-hover:opacity-60')}`} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-black text-white uppercase tracking-tight group-hover:text-steam-highlight transition-colors">{ach.name}</h3>
                            {ach.isHidden && !isUnlocked && <EyeOff className="w-3 h-3 text-gray-600" />}
                          </div>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed truncate max-w-md">
                            {ach.isHidden && !isUnlocked ? 'Conquista secreta. Desbloqueie para ver os detalhes.' : ach.description}
                          </p>
                        </div>
                        <div className="text-right">
                           <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${getDifficultyColor(ach.difficulty)}`}>{ach.difficulty}</div>
                           <div className="text-xs font-black text-gray-600">{ach.xp} XP</div>
                        </div>
                      </div>
                    );
                 })}
              </div>
            ) : (
              <div className="animate-fade-in">
                 {extrasBlocks.map((block, idx) => (
                    <BuilderBlock 
                      key={block.id} 
                      content={block} 
                      isEditMode={editMode} 
                      onMove={(dir) => reorderExtraBlock(idx, dir)}
                      onDelete={deleteContent}
                      onUpdate={updateContent}
                    />
                 ))}

                 {extrasBlocks.length === 0 && !editMode && (
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-20">
                        <div className="p-10 rounded-full bg-white/5 border-2 border-dashed border-transparent">
                          <Zap className="w-20 h-20 text-gray-400" />
                        </div>
                        <p className="mt-8 text-sm font-black uppercase tracking-[0.4em] text-gray-400">Nenhum Extra Encontrado</p>
                    </div>
                 )}

                 {editMode && currentUser?.isAdmin && (
                    <div className="relative z-20 my-12 border-2 border-dashed border-transparent rounded-2xl hover:border-steam-highlight/40 transition-all p-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {[
                            { type: 'text', label: 'Texto', icon: <AlignLeft className="w-4 h-4" /> },
                            { type: 'image', label: 'Imagem', icon: <ImageIcon className="w-4 h-4" /> },
                            { type: 'video', label: 'Vídeo', icon: <Video className="w-4 h-4" /> },
                            { type: 'alert', label: 'Aviso', icon: <AlertTriangle className="w-4 h-4" /> },
                            { type: 'list', label: 'Lista', icon: <ListChecks className="w-4 h-4" /> }
                          ].map(item => (
                              <button key={item.type} onClick={() => handleAddExtraBlock(item.type as ContentType, extrasBlocks.length)} className="p-4 rounded-xl hover:bg-steam-highlight hover:text-steam-dark flex flex-col items-center gap-2 transition-all text-gray-400 text-[10px] font-black uppercase tracking-widest border border-transparent">
                                  {item.icon}
                                  {item.label}
                              </button>
                          ))}
                        </div>
                    </div>
                  )}
               </div>
            )}
         </div>

         {/* Right: Stats & Sidebar Info */}
         <div className="space-y-8">
            <div className="bg-steam-dark p-8 rounded-2xl border border-transparent shadow-3xl">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Status da Campanha</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                       <span className="text-white">Progresso Geral</span>
                       <span className="text-steam-highlight">{progress}%</span>
                    </div>
                    <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-transparent">
                       <div className="h-full bg-gradient-to-r from-steam-highlight to-blue-500 shadow-[0_0_10px_rgba(102,192,244,0.4)]" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-black/20 p-4 rounded-xl border border-transparent">
                        <div className="text-2xl font-black text-white">{unlockedCount}</div>
                        <div className="text-[8px] text-gray-500 uppercase font-black">Coletadas</div>
                     </div>
                     <div className="bg-black/20 p-4 rounded-xl border border-transparent">
                        <div className="text-2xl font-black text-white">{gameAchievements.length - unlockedCount}</div>
                        <div className="text-[8px] text-gray-500 uppercase font-black">Restantes</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-steam-highlight/10 to-transparent p-8 rounded-2xl border border-transparent">
               <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="text-steam-highlight w-6 h-6" />
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Dica do Mestre</h3>
               </div>
               <p className="text-xs text-gray-300 font-medium leading-loose italic opacity-80">
                  "Utilize o scanner visual para validar suas conquistas sem precisar de capturas manuais. Nosso algoritmo reconhece os padrões de cores da Steam."
               </p>
            </div>
         </div>
      </div>
      </div>

      {selectedAchievement && (
        <AchievementModal 
          achievement={selectedAchievement} 
          game={game} 
          onClose={() => setSelectedAchievement(null)} 
          onNavigateProfile={onNavigateProfile}
        />
      )}

      {showValidator && (
        <SteamValidator 
          gameId={game.id} 
          onClose={() => setShowValidator(false)} 
        />
      )}
      {showAI && (
        <AIAssistant 
          game={game}
          onClose={() => setShowAI(false)}
        />
      )}
    </>
  );
};
