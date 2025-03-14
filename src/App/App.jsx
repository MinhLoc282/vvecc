import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { AuthProvider } from "../hooks/use-auth-client";

import { LOCATION } from "../constants";

import Layout from "../layout/Layout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
// New Pages
import MyCollateralPage from "../pages/collateral/MyCollateralPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import LoanMarketplacePage from "../pages/loan/LoanMarketplacePage";
import MyLoansPage from "../pages/loan/MyLoansPage";
import LoanDetailsPage from "../pages/loan/LoanDetailsPage";
import AdminUserManagementPage from "../pages/admin/AdminUserManagementPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { MarketPlacePage } from "../pages/marketplace/MarketPlacePage";
import { MyLoanPage } from "../pages/myloan/MyLoanPage";
import { AdminDashboard } from "../pages/AdminDashboard/AdminDashboard";
import { LoanNFTMarketplacePage } from "../pages/marketplace/NFTMarketPlacePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={LOCATION.USER_DASHBOARD} replace />}
        />

        <Route path={LOCATION.USER_DASHBOARD} element={<Layout />}>
          <Route index element={<DashboardPage />} />
        </Route>
        {/* <Route path={LOCATION.LOAN_MARKETPLACE} element={<Layout />}>
          <Route index element={<LoanMarketplacePage />} />
        </Route> */}
        <Route path={LOCATION.LOAN_MARKETPLACE} element={<Layout />}>
          <Route index element={<MarketPlacePage />} />
        </Route>
        <Route path={LOCATION.NFT_MARKETPLACE} element={<Layout />}>
          <Route index element={<LoanNFTMarketplacePage />} />
        </Route>
        {/* My Collateral Page */}
        <Route path={LOCATION.MY_COLLATERAL} element={<Layout />}>
          <Route index element={<MyCollateralPage />} />
        </Route>

        {/* Admin Dashboard Page (for approving collateral) */}
        <Route
          path={LOCATION.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
        </Route>
        {/* <Route
          path={LOCATION.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
        </Route> */}

        {/* Loan Marketplace Page */}
        <Route path={LOCATION.LOAN_MARKETPLACE} element={<Layout />}>
          <Route index element={<LoanMarketplacePage />} />
        </Route>

        {/* My Loans Page */}
        <Route path={LOCATION.MY_LOANS} element={<Layout />}>
          <Route index element={<MyLoansPage />} />
        </Route>

        <Route path={LOCATION.MY_LOAN} element={<Layout />}>
          <Route index element={<MyLoanPage/>} />
        </Route>

        {/* Loan Details Page */}
        <Route path={LOCATION.LOAN_DETAILS} element={<Layout />}>
          <Route index element={<LoanDetailsPage />} />
        </Route>

        {/* Admin User Management Page (for owner to add/remove admins) */}
        <Route
          path={LOCATION.ADMIN_USER_MANAGEMENT}
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminUserManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function MyApp() {
  return (
    <RecoilRoot>
      <AuthProvider>
        <App />
      </AuthProvider>
    </RecoilRoot>
  );
}
