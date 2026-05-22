import { Headphones } from "lucide-react";

export function ContactSupport() {
    return (
        <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=kasbai2025@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 hover:text-black group cursor-pointer"
            title="Contact Support"
        >
            <Headphones className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Contact</span>
        </a>
    );
}
