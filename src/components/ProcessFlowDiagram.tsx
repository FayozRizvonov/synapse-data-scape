import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Megaphone, Smartphone, Search } from 'lucide-react';

interface ProcessLevel {
  level: number;
  circles: number[];
  color: string;
}

interface ProcessFlowDiagramProps {
  activePersona: string;
}

const ProcessFlowDiagram: React.FC<ProcessFlowDiagramProps> = ({ activePersona }) => {
  const processLevels: ProcessLevel[] = [
    { level: 1, circles: [1, 2, 3, 4], color: '#06B6D4' },
    { level: 2, circles: [1, 2, 3], color: '#06B6D4' },
    { level: 3, circles: [1, 2], color: '#06B6D4' },
    { level: 4, circles: [1, 2], color: '#06B6D4' }
  ];

  const lineWidth = 500; // Одинаковая длина для всех линий

  // Маппинг персон к уровням
  const personaToLevel: { [key: string]: number } = {
    'tech-savvy': 1,
    'traditional': 2,
    'hybrid': 3,
    'premium': 4
  };

  const getIconForCircle = (level: number, circleNumber: number) => {
    if (level === 1) {
      switch (circleNumber) {
        case 1:
          return <Pill className="w-6 h-6 text-white" />;
        case 2:
          return <Megaphone className="w-6 h-6 text-white" />;
        case 3:
          return <Smartphone className="w-6 h-6 text-white" />;
        case 4:
          return <Search className="w-6 h-6 text-white" />;
        default:
          return null;
      }
    } else if (level === 2) {
      switch (circleNumber) {
        case 1:
          return <Pill className="w-6 h-6 text-white" />;
        case 2:
          return <Megaphone className="w-6 h-6 text-white" />;
        case 3:
          return <Search className="w-6 h-6 text-white" />;
        default:
          return null;
      }
    } else if (level === 3) {
      switch (circleNumber) {
        case 1:
          return <Pill className="w-6 h-6 text-white" />;
        case 2:
          return <Smartphone className="w-6 h-6 text-white" />;
        default:
          return null;
      }
    } else if (level === 4) {
      switch (circleNumber) {
        case 1:
          return <Smartphone className="w-6 h-6 text-white" />;
        case 2:
          return <Search className="w-6 h-6 text-white" />;
        default:
          return null;
      }
    }
    return null;
  };

  const getCirclePositions = (level: number, circleCount: number) => {
    const margin = 40; // Отступ от краев
    const usableWidth = lineWidth - (margin * 2); // Рабочая ширина
    
    // Фиксированные позиции для каждого типа иконки
    const iconPositions = {
      pill: margin, // Позиция 1
      megaphone: margin + usableWidth / 3, // Позиция 2
      smartphone: margin + (usableWidth / 3) * 2, // Позиция 3
      search: margin + usableWidth // Позиция 4
    };
    
    switch (level) {
      case 1: // Pill, Megaphone, Smartphone, Search
        return [
          iconPositions.pill,
          iconPositions.megaphone,
          iconPositions.smartphone,
          iconPositions.search
        ];
      case 2: // Pill, Megaphone, Search
        return [
          iconPositions.pill,
          iconPositions.megaphone,
          iconPositions.search
        ];
      case 3: // Pill, Smartphone
        return [
          iconPositions.pill,
          iconPositions.smartphone
        ];
      case 4: // Smartphone, Search
        return [
          iconPositions.smartphone,
          iconPositions.search
        ];
      default:
        return [lineWidth / 2];
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
          Process Flow Diagram
        </h3>
      </div>
        
        <div className="space-y-0">
          {processLevels.map((level, levelIndex) => {
            const circlePositions = getCirclePositions(level.level, level.circles.length);
            
            // Расчет точного отступа для выравнивания с карточками персон
            const topMargin = levelIndex === 0 ? 0 : 
                            levelIndex === 1 ? 110 : 
                            levelIndex === 2 ? 110 : 110;
            
            // Проверяем, является ли уровень активным
            const isActiveLevel = personaToLevel[activePersona] === level.level;
            const levelOpacity = isActiveLevel ? 1 : 0.3;
            const levelColor = isActiveLevel ? level.color : '#64748b';
            
            return (
              <motion.div
                key={level.level}
                className="relative flex justify-center"
                style={{ marginTop: `${topMargin}px` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: levelIndex * 0.2 }}
              >
                <div style={{ width: lineWidth, position: 'relative' }}>
                  {/* Основная SVG с линией и элементами */}
                  <svg
                    width={lineWidth + 40}
                    height="120"
                    className="absolute -left-5"
                    style={{ top: '-40px' }}
                  >
                    {/* Левая стрелка */}
                    <polygon
                      points="8,47 16,43 16,51"
                      fill={levelColor}
                      opacity={levelOpacity}
                    />
                    
                    {/* Правая стрелка */}
                    <polygon
                      points={`${lineWidth + 32},47 ${lineWidth + 24},43 ${lineWidth + 24},51`}
                      fill={levelColor}
                      opacity={levelOpacity}
                    />

                    {/* Маленькие кружки с цифрами НА линии */}
                    {level.circles.map((circleNumber, circleIndex) => (
                      <g key={`small-${circleNumber}`}>
                        {/* Основная горизонтальная линия (пунктирная) - разделена на сегменты между кружками */}
                        {circleIndex === 0 && (
                          <line
                            x1="20"
                            y1="47"
                            x2={circlePositions[circleIndex] + 20 - 12}
                            y2="47"
                            stroke={levelColor}
                            strokeWidth="2"
                            strokeDasharray="6,3"
                            opacity={levelOpacity}
                          />
                        )}
                        {circleIndex < level.circles.length - 1 && (
                          <line
                            x1={circlePositions[circleIndex] + 20 + 12}
                            y1="47"
                            x2={circlePositions[circleIndex + 1] + 20 - 12}
                            y2="47"
                            stroke={levelColor}
                            strokeWidth="2"
                            strokeDasharray="6,3"
                            opacity={levelOpacity}
                          />
                        )}
                        {circleIndex === level.circles.length - 1 && (
                          <line
                            x1={circlePositions[circleIndex] + 20 + 12}
                            y1="47"
                            x2={lineWidth + 20}
                            y2="47"
                            stroke={levelColor}
                            strokeWidth="2"
                            strokeDasharray="6,3"
                            opacity={levelOpacity}
                          />
                        )}
                        
                        {/* Маленький кружок */}
                        <circle
                          cx={circlePositions[circleIndex] + 20}
                          cy="47"
                          r="12"
                          fill={levelColor}
                          opacity={levelOpacity}
                        />
                        {/* Цифра в маленьком кружке */}
                        <text
                          x={circlePositions[circleIndex] + 20}
                          y="52"
                          textAnchor="middle"
                          className="text-xs font-bold fill-white"
                          opacity={levelOpacity}
                        >
                          {circleNumber}
                        </text>
                        {/* Вертикальная соединительная линия */}
                        <line
                          x1={circlePositions[circleIndex] + 20}
                          y1="59"
                          x2={circlePositions[circleIndex] + 20}
                          y2="73"
                          stroke={levelColor}
                          strokeWidth="2"
                          strokeDasharray="3,2"
                          opacity={levelOpacity * 0.6}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Большие кружки ПОД линией */}
                  <div className="relative mt-8">
                    {level.circles.map((circleNumber, circleIndex) => (
                      <motion.div
                        key={`big-${level.level}-${circleNumber}`}
                        className="absolute"
                        style={{
                          left: `${circlePositions[circleIndex] - 30}px`,
                          top: '5px'
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: levelIndex * 0.2 + circleIndex * 0.1,
                          type: "spring",
                          stiffness: 100
                        }}
                      >
                        {/* Большой круг */}
                        <div
                          className="w-16 h-16 rounded-full border-4 bg-white/10 dark:bg-black/20 flex items-center justify-center relative overflow-hidden"
                          style={{ 
                            borderColor: levelColor,
                            boxShadow: `0 0 20px ${levelColor}30`,
                            opacity: levelOpacity
                          }}
                        >
                          {/* Внутренний градиент */}
                          <div
                            className="absolute inset-2 rounded-full opacity-20"
                            style={{
                              background: `radial-gradient(circle, ${levelColor}40 0%, transparent 70%)`
                            }}
                          />
                          
                          {/* Иконка для всех уровней */}
                          {(level.level === 1 || level.level === 2 || level.level === 3 || level.level === 4) && (
                            <div className="relative z-10">
                              {getIconForCircle(level.level, circleNumber)}
                            </div>
                          )}
                          
                          {/* Анимированный эффект пульсации */}
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 opacity-30"
                            style={{ borderColor: levelColor }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3 * levelOpacity, 0.1 * levelOpacity, 0.3 * levelOpacity]
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              delay: circleIndex * 0.3
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
    </div>
  );
};

export default ProcessFlowDiagram; 