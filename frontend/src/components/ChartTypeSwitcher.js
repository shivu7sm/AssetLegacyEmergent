import { Button } from '@/components/ui/button';
import { PieChart, BarChart3, LineChart, Donut } from 'lucide-react';

export default function ChartTypeSwitcher({ currentType, onChange, availableTypes = ['pie', 'bar', 'line', 'donut'] }) {
  const chartTypes = [
    { value: 'pie', icon: PieChart, label: 'Pie' },
    { value: 'bar', icon: BarChart3, label: 'Bar' },
    { value: 'line', icon: LineChart, label: 'Line' },
    { value: 'donut', icon: Donut, label: 'Donut' }
  ];

  const filteredTypes = chartTypes.filter(type => availableTypes.includes(type.value));

  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{background: '#16001e'}}>
      {filteredTypes.map((type) => {
        const Icon = type.icon;
        const isActive = currentType === type.value;
        
        return (
          <Button
            key={type.value}
            onClick={() => onChange(type.value)}
            variant="ghost"
            size="sm"
            className="px-3 py-2 transition-all"
            style={{
              background: isActive ? 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)' : 'transparent',
              color: isActive ? '#fff' : '#94a3b8'
            }}
          >
            <Icon className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">{type.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
