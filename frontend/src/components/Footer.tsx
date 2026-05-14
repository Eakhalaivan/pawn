import { TrustBadges } from './TrustBadges';

const Footer: React.FC = () => {
    return (
        <>
            <TrustBadges />
            <footer className="bg-purple-900 text-white text-center p-6">
                <h3 className="text-xl font-bold mb-2">RCB jewelry's & Pawn shop</h3>
                <p className="text-sm opacity-75">&copy; {new Date().getFullYear()} All rights reserved. Your trusted partner for quality and value.</p>
            </footer>
        </>
    );
};

export default Footer;
