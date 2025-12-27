import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useComfortReadings } from '@/hooks/useComfortReadings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getComfortDetails } from '@/utils/mockData';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

export default function History() {
  const { readings, loading } = useComfortReadings();

  const getComfortBadgeClass = (level: number) => {
    const classes: Record<number, string> = { 1: 'bg-comfort-1', 2: 'bg-comfort-2', 3: 'bg-comfort-3', 4: 'bg-comfort-4', 5: 'bg-comfort-5' };
    return classes[level] || '';
  };

  if (loading) return <DashboardLayout><div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="font-display text-2xl font-bold">History</h1><p className="text-muted-foreground">Past comfort predictions for clinical tracking</p></div>

        {readings.length === 0 ? (
          <div className="medical-card text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No readings yet</h3>
            <p className="text-muted-foreground">Your comfort readings will appear here as they're recorded.</p>
          </div>
        ) : (
          <div className="medical-card overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Comfort Level</TableHead>
                  <TableHead className="hidden md:table-cell">LF (ms²)</TableHead>
                  <TableHead className="hidden md:table-cell">HF (ms²)</TableHead>
                  <TableHead className="hidden lg:table-cell">LF/HF</TableHead>
                  <TableHead className="hidden lg:table-cell">EDA Tonic</TableHead>
                  <TableHead className="hidden lg:table-cell">EDA Phasic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell>{format(new Date(reading.recorded_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell><Badge className={`${getComfortBadgeClass(reading.comfort_level)} text-white`}>{reading.comfort_level} - {getComfortDetails(reading.comfort_level).label}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{reading.lf_power?.toFixed(2) || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">{reading.hf_power?.toFixed(2) || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{reading.lf_hf_ratio?.toFixed(2) || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{reading.eda_tonic?.toFixed(3) || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{reading.eda_phasic?.toFixed(3) || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}