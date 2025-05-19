import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  onDateChange: (startDate: Date, endDate: Date) => void;
}

export default function DateRangePicker({ onDateChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      onDateChange(new Date(start), new Date(end));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Calendar className="w-5 h-5 text-gray-500" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => handleDateChange(e.target.value, endDate)}
        className="px-3 py-2 border rounded-lg"
      />
      <span>to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => handleDateChange(startDate, e.target.value)}
        className="px-3 py-2 border rounded-lg"
      />
    </div>
  );
}