import { Headphones } from "lucide-react";

export function ContactSupport() {
    return (
        <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=kasbai2025@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full hover:bg-white/10 transition-colors text-white group cursor-pointer"
            title="Contact Support"
        >
            <Headphones className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-bold text-sm">Contact</span>
        </a>
    );
}
