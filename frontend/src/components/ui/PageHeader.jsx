export default function PageHeader({ title, description, actions }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
                {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 items-center">{actions}</div>}
        </div>
    );
}