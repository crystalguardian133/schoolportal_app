import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

type BarChartProps = {
    data: { label: string; value: number }[];
    title?: string;
    xKey?: string;
    yKey?: string;
    color?: string;
};

export function SimpleBarChart({ data, title, xKey = 'label', yKey = 'value', color = '#8b5cf6' }: BarChartProps) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            {title && <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h3>}
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-background)',
                        }}
                    />
                    <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

type PieChartProps = {
    data: { label: string; value: number }[];
    title?: string;
};

export function SimplePieChart({ data, title }: PieChartProps) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            {title && <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h3>}
            <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                    {data.map((item, i) => (
                        <div key={item.label} className="flex items-center gap-2 text-sm">
                            <span className="size-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
