import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ArrowLeft, Search, Building2, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

interface School {
  id: string;
  name: string;
  school_id: string;
  district: string | null;
  state: string | null;
}

const SchoolsDirectory = () => {
  const { t, language } = useLanguage();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-schools-public", {
        body: { action: "list" },
      });

      if (error || data?.error) {
        console.error("Load schools error:", error || data?.error);
        setLoading(false);
        return;
      }

      const list = (data?.schools as School[]) ?? [];
      setSchools(list);
    } catch (error) {
      console.error("Error loading schools:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique states and districts
  const uniqueStates = useMemo(() => {
    const states = schools
      .map(s => s.state)
      .filter((s): s is string => !!s);
    return [...new Set(states)].sort();
  }, [schools]);

  const uniqueDistricts = useMemo(() => {
    const districts = schools
      .filter(s => selectedState === "all" || s.state === selectedState)
      .map(s => s.district)
      .filter((d): d is string => !!d);
    return [...new Set(districts)].sort();
  }, [schools, selectedState]);

  // Filter schools
  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = 
        school.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        school.district?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        school.state?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesState = selectedState === "all" || school.state === selectedState;
      const matchesDistrict = selectedDistrict === "all" || school.district === selectedDistrict;
      
      return matchesSearch && matchesState && matchesDistrict;
    });
  }, [schools, debouncedSearch, selectedState, selectedDistrict]);

  // Reset district when state changes
  useEffect(() => {
    setSelectedDistrict("all");
  }, [selectedState]);

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/signup" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {language === 'en' ? 'Back to Signup' : 'वापस जाएं'}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {language === 'en' ? 'Schools Directory' : 'स्कूल डायरेक्टरी'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'en' 
                ? 'Find your school before signing up' 
                : 'साइन अप करने से पहले अपना स्कूल खोजें'}
            </p>
          </div>

          {/* Filters */}
          <div className="edu-card p-4 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={language === 'en' ? "Search schools..." : "स्कूल खोजें..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* State Filter */}
              <select
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="all">{language === 'en' ? 'All States' : 'सभी राज्य'}</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              {/* District Filter */}
              <select
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={selectedState === "all"}
              >
                <option value="all">{language === 'en' ? 'All Districts' : 'सभी जिले'}</option>
                {uniqueDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schools List */}
          <div className="edu-card overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {language === 'en' 
                  ? `${filteredSchools.length} Schools Found` 
                  : `${filteredSchools.length} स्कूल मिले`}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  {language === 'en' ? 'Loading schools...' : 'स्कूल लोड हो रहे हैं...'}
                </p>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  {language === 'en' ? 'No schools found' : 'कोई स्कूल नहीं मिला'}
                </p>
                <p className="text-sm">
                  {language === 'en' 
                    ? 'Try adjusting your search or filters' 
                    : 'खोज या फ़िल्टर बदलकर देखें'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{school.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{school.district || 'N/A'}, {school.state || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              {language === 'en' 
                ? "Found your school? Go back to signup and select it!" 
                : "अपना स्कूल मिल गया? साइन अप पर वापस जाएं!"}
            </p>
            <Button variant="hero" onClick={() => window.history.back()}>
              <BookOpen className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Continue to Signup' : 'साइन अप जारी रखें'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchoolsDirectory;
