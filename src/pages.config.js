import WorkspaceDashboard from './pages/WorkspaceDashboard.jsx';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Deals from './pages/Deals';
import Lenders from './pages/Lenders';
import Team from './pages/Team';
import __Layout from './Layout.jsx';
import REIApprovalPage from './pages/REIApprovalPage.jsx';
import REITermSheetPage from './pages/REITermSheetPage.jsx';
import MAndADealRoom from './pages/MAndADealRoom.jsx';
import REIDealAnalyzerPage from './pages/REIDealAnalyzerPage.jsx';
import REIFormPage from './pages/REIFormPage.jsx';
import ALSLoanServicingPage from './pages/ALSLoanServicingPage.jsx';

export const PAGES = {
    "Dashboard": WorkspaceDashboard,
    "Leads": Leads,
    "Pipeline": Pipeline,
    "Deals": Deals,
    "Tasks": Tasks,
    "Lenders": Lenders,
    "Team": Team,
    "Reports": Reports,
    "UnderwritingApproval": REIApprovalPage,
    "TermSheets": REITermSheetPage,
    "MAndADealRoom": MAndADealRoom,
    "REIDealAnalyzer": REIDealAnalyzerPage,
    "REIForm": REIFormPage,
    "ALSLoanServicing": ALSLoanServicingPage,
};

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
