import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { AuthProvider } from "../hooks/use-auth-client";

import { LOCATION } from "../constants";

import Layout from "../layout/Layout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "../components/PublicRoute/PublicRoute";
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
import Login from "../pages/login/Login";
import Register from "../pages/register/Register";
import ForgotPassword from "../pages/forgotPassword/ForgotPassword";
import KYC from "../pages/kyc/KYC";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={LOCATION.USER_DASHBOARD} replace />}
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path={LOCATION.USER_DASHBOARD}>
            <Route index element={<DashboardPage />} />
          </Route>
          <Route path={LOCATION.LOAN_MARKETPLACE}>
            <Route index element={<MarketPlacePage />} />
          </Route>
          <Route path={LOCATION.NFT_MARKETPLACE}>
            <Route index element={<LoanNFTMarketplacePage />} />
          </Route>
          <Route path={LOCATION.MY_COLLATERAL}>
            <Route index element={<MyCollateralPage />} />
          </Route>
          <Route path={LOCATION.ADMIN_DASHBOARD}>
            <Route index element={<AdminDashboardPage />} />
          </Route>
          <Route path={LOCATION.MY_LOANS}>
            <Route index element={<MyLoansPage />} />
          </Route>
          <Route path={LOCATION.MY_LOAN}>
            <Route index element={<MyLoanPage />} />
          </Route>
          <Route path={LOCATION.LOAN_DETAILS}>
            <Route index element={<LoanDetailsPage />} />
          </Route>
          <Route path={LOCATION.ADMIN_USER_MANAGEMENT}>
            <Route index element={<AdminUserManagementPage />} />
          </Route>
        </Route>

        {/* Public Routes */}
        <Route path={LOCATION.LOGIN} element={<PublicRoute><Layout /></PublicRoute>}>
          <Route index element={<Login />} />
        </Route>
        <Route path={LOCATION.REGRISTER} element={<PublicRoute><Layout /></PublicRoute>}>
          <Route index element={<Register />} />
        </Route>
        <Route path={LOCATION.FORGOT_PASSWORD} element={<PublicRoute><Layout /></PublicRoute>}>
          <Route index element={<ForgotPassword />} />
        </Route>
        <Route path={LOCATION.KYC} element={<PublicRoute><Layout /></PublicRoute>}>
          <Route index element={<KYC />} />
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
