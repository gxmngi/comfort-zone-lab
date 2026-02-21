import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, Profile } from '@/hooks/useProfile';
import { Search, User, Phone, ArrowLeft } from 'lucide-react';

export default function PatientList() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<any>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayName = profile?.first_name && profile?.last_name 
    ? `Dr. ${profile.first_name} ${profile.last_name}`
    : user?.email ? `Dr. ${user.email}` : "Doctor";

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        // Relaxed filter: Allow if role is 'user' OR null. 
        // Simplest way is to fetch all and filter client-side, or use .neq('role', 'doctor')
        .neq('role', 'doctor') 
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching patients:', error);
        setError(error);
      } else {
        setPatients(data as Profile[]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    const email = (patient.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });



  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header 
        userName={displayName} 
        userRole="Doctor" 
        onLogout={handleSignOut}
      />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          {/* ... existing header code ... */}
          <div className="mb-8 ">
            <Button 
                variant="ghost" 
                className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
                onClick={() => navigate('/doctor-menu')}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Patient List</h2>
                    <p className="mt-1 text-lg text-muted-foreground">Total Patients: {filteredPatients.length}</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name..." 
                        className="pl-9 bg-card"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="mx-auto mt-6 h-1 w-full border-t border-border" />
          </div>



          {/* Patients Grid */}
          {loading ? (
             <div className="text-center py-12 text-muted-foreground">Loading patients...</div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPatients.map((patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow bg-card border-border/50 group flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2 cursor-pointer" onClick={() => navigate(`/history/${patient.id}`)}>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <User className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">
                                {patient.first_name ? `${patient.first_name} ${patient.last_name || ''}` : 'Unknown'}
                            </CardTitle>
                            <CardDescription className="truncate">
                                {patient.email}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-2 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{patient.phone || 'No phone number'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                           <span className={`px-2 py-1 rounded bg-secondary text-secondary-foreground`}>
                              {patient.gender || 'N/A'}
                           </span>
                           <span className={`px-2 py-1 rounded bg-secondary text-secondary-foreground`}>
                              {patient.date_of_birth ? new Date(patient.date_of_birth).getFullYear() : 'N/A'}
                           </span>
                        </div>
                        
                        <div className="flex gap-2 mt-auto pt-2">
                           <Button 
                             className="flex-1 bg-primary hover:bg-primary/90 text-white" 
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate(`/dashboard/${patient.id}`);
                             }}
                           >
                             Live Monitor
                           </Button>
                           <Button 
                             variant="outline" 
                             className="flex-1 border-primary/20 hover:bg-primary/5 text-primary"
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate(`/history/${patient.id}`);
                             }}
                           >
                             History
                           </Button>
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                     <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No patients found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms.</p>
            </div>
          )}
          

        </div>
      </main>

      <Footer />
    </div>
  );
}
