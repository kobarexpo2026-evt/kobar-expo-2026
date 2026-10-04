import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AdminPlaceholderPageProps {
  title: string;
  tabKey: string;
  phase: string;
  features: string[];
}

export const AdminPlaceholderPage: React.FC<AdminPlaceholderPageProps> = ({
  title,
  tabKey,
  phase,
  features,
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="bg-white dark:bg-[#201813] border-2 border-dashed border-amber-300 dark:border-amber-800">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="festival">Tahap Pengembangan: {phase}</Badge>
            <span className="font-mono text-xs text-stone-500">Modul: {tabKey}</span>
          </div>
          <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
          <CardDescription>
            Fondasi basis data, skema SQL, RPC atomik, dan hak akses RBAC untuk modul ini telah siap di database.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300 font-baloo">
            Fitur lengkap yang disiapkan untuk tahap berikutnya sesuai instruksi kerja bertahap:
          </p>

          <ul className="space-y-2">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-stone-600 dark:text-stone-400 font-baloo">
                <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
