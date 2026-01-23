import { Trophy, TrendingUp, Clock, Calendar, Medal, Award, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RankingData {
  id: string;
  name: string;
  photo?: string;
  class: string;
  improvementScore: number;
  dailyStudyTime: number; // in minutes
  weeklyStudyDays: number;
  totalScore: number;
  rank: number;
}

interface StudentRankingProps {
  rankings: RankingData[];
  currentStudentId?: string;
  title?: string;
  showTop?: number;
}

const StudentRanking = ({ 
  rankings, 
  currentStudentId, 
  title = "Student Rankings",
  showTop = 10 
}: StudentRankingProps) => {
  const { t } = useLanguage();
  
  const displayRankings = rankings.slice(0, showTop);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-500 to-orange-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  const formatStudyTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (rankings.length === 0) {
    return (
      <div className="edu-card p-6 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No ranking data available yet</p>
        <p className="text-sm text-muted-foreground mt-1">Rankings appear after students complete study sessions</p>
      </div>
    );
  }

  return (
    <div className="edu-card overflow-hidden">
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Based on improvement, daily study time & weekly consistency
        </p>
      </div>
      
      <div className="divide-y divide-border">
        {displayRankings.map((student) => {
          const isCurrentStudent = student.id === currentStudentId;
          
          return (
            <div 
              key={student.id} 
              className={`p-3 sm:p-4 transition-colors ${
                isCurrentStudent 
                  ? 'bg-primary/5 border-l-4 border-l-primary' 
                  : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeClass(student.rank)}`}>
                  {student.rank <= 3 ? getRankIcon(student.rank) : `#${student.rank}`}
                </div>
                
                {/* Student Photo & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {student.photo ? (
                    <img 
                      src={student.photo} 
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                      {student.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {student.name}
                      {isCurrentStudent && (
                        <span className="ml-2 text-xs text-primary font-normal">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{student.class}</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-accent" title="Improvement Score">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{student.improvementScore}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary" title="Daily Study Time">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{formatStudyTime(student.dailyStudyTime)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-warning" title="Days Studied This Week">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{student.weeklyStudyDays}/7</span>
                  </div>
                </div>
                
                {/* Total Score */}
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">{student.totalScore}</p>
                  <p className="text-[10px] text-muted-foreground">points</p>
                </div>
              </div>
              
              {/* Mobile Stats */}
              <div className="flex sm:hidden items-center gap-4 mt-2 ml-11 text-xs">
                <div className="flex items-center gap-1 text-accent">
                  <TrendingUp className="w-3 h-3" />
                  <span>{student.improvementScore}%</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Clock className="w-3 h-3" />
                  <span>{formatStudyTime(student.dailyStudyTime)}</span>
                </div>
                <div className="flex items-center gap-1 text-warning">
                  <Calendar className="w-3 h-3" />
                  <span>{student.weeklyStudyDays}d</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {rankings.length > showTop && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t border-border bg-muted/30">
          Showing top {showTop} of {rankings.length} students
        </div>
      )}
    </div>
  );
};

export default StudentRanking;

// Utility function to calculate rankings from student data
export const calculateRankings = (students: Array<{
  id: string;
  name: string;
  photo?: string;
  class: string;
  studySessions: Array<{
    improvement_score?: number;
    time_spent?: number;
    created_at: string;
  }>;
}>): RankingData[] => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  
  const studentScores = students.map(student => {
    const sessions = student.studySessions || [];
    
    // Calculate average improvement score
    const improvementScores = sessions
      .map(s => s.improvement_score || 50)
      .slice(0, 10);
    const avgImprovement = improvementScores.length > 0
      ? Math.round(improvementScores.reduce((a, b) => a + b, 0) / improvementScores.length)
      : 0;
    
    // Calculate today's study time
    const todaySessions = sessions.filter(s => 
      new Date(s.created_at) >= startOfToday
    );
    const dailyStudyTime = todaySessions.reduce((acc, s) => acc + (s.time_spent || 0), 0);
    
    // Calculate unique study days this week
    const weekSessions = sessions.filter(s => 
      new Date(s.created_at) >= startOfWeek
    );
    const uniqueDays = new Set(
      weekSessions.map(s => new Date(s.created_at).toDateString())
    ).size;
    
    // Calculate total score with weighted formula:
    // - Improvement: 40% weight (max 100 points * 0.4 = 40)
    // - Daily study time: 30% weight (max 120 mins = 30 points)
    // - Weekly consistency: 30% weight (7 days = 30 points)
    const improvementPoints = avgImprovement * 0.4;
    const dailyPoints = Math.min(dailyStudyTime, 120) * 0.25; // Max 30 points for 120+ mins
    const consistencyPoints = (uniqueDays / 7) * 30;
    
    const totalScore = Math.round(improvementPoints + dailyPoints + consistencyPoints);
    
    return {
      id: student.id,
      name: student.name,
      photo: student.photo,
      class: student.class,
      improvementScore: avgImprovement,
      dailyStudyTime,
      weeklyStudyDays: uniqueDays,
      totalScore,
      rank: 0 // Will be assigned after sorting
    };
  });
  
  // Sort by total score descending
  studentScores.sort((a, b) => b.totalScore - a.totalScore);
  
  // Assign ranks
  studentScores.forEach((student, index) => {
    student.rank = index + 1;
  });
  
  return studentScores;
};
