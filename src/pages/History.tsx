import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useComfortReadings } from '@/hooks/useComfortReadings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getComfortDetails } from '@/utils/mockData';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

// Mock data for demonstration when no readings exist
const mockReadings = [
  {
    id: '1',
    recorded_at: '2025-12-27T14:00:00Z',
    comfort_level: 4,
    lf_power: 856.42,
    hf_power: 423.18,
    lf_hf_ratio: 2.02,
    eda_tonic: 3.245,
    eda_phasic: 0.156,
  },
  {
    id: '2',
    recorded_at: '2025-12-27T13:30:00Z',
    comfort_level: 3,
    lf_power: 912.67,
    hf_power: 389.54,
    lf_hf_ratio: 2.34,
    eda_tonic: 3.512,
    eda_phasic: 0.289,
  },
  {
    id: '3',
    recorded_at: '2025-12-27T13:00:00Z',
    comfort_level: 2,
    lf_power: 1045.23,
    hf_power: 298.76,
    lf_hf_ratio: 3.50,
    eda_tonic: 4.123,
    eda_phasic: 0.892,
  },
  {
    id: '4',
    recorded_at: '2025-12-27T12:30:00Z',
    comfort_level: 5,
    lf_power: 723.89,
    hf_power: 512.34,
    lf_hf_ratio: 1.41,
    eda_tonic: 2.876,
    eda_phasic: 0.045,
  },
  {
    id: '5',
    recorded_at: '2025-12-27T12:00:00Z',
    comfort_level: 4,
    lf_power: 798.56,
    hf_power: 445.67,
    lf_hf_ratio: 1.79,
    eda_tonic: 3.098,
    eda_phasic: 0.178,
  },
];

export default function History() {
  const { readings: dbReadings, loading } = useComfortReadings();

  // Use mock data if no database readings exist
  const readings = dbReadings.length > 0 ? dbReadings : mockReadings;

  const getComfortBadgeClass = (level: number) => {
    const classes: Record<number, string> = { 1: 'bg-comfort-1', 2: 'bg-comfort-2', 3: 'bg-comfort-3', 4: 'bg-comfort-4', 5: 'bg-comfort-5' };
    return classes[level] || '';
  };

  if (loading) return <DashboardLayout><div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="font-display text-2xl font-bold">History</h1><p className="text-muted-foreground">Past comfort predictions for clinical tracking</p></div>

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
      </div>
    </DashboardLayout>
  );
}
