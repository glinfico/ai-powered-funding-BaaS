import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { pagesConfig } from './pages.config';

export default function App() {
  const { Pages, Layout, mainPage } = pagesConfig;

  return (
    <BrowserRouter>
      <Routes>
        {/* Automatically sets up routes for all your pages using your Layout sidebar */}
        {Object.entries(Pages).map(([pageName, PageComponent]) => {
          const path = `/${pageName}`;
          const isMain = pageName === mainPage;
          
          return (
            <React.Fragment key={pageName}>
              <Route
                path={path}
                element={
                  <Layout currentPageName={pageName}>
                    <PageComponent />
                  </Layout>
                }
              />
              {/* Sets your main page as the default home screen (/) */}
              {isMain && (
                <Route
                  path="/"
                  element={
                    <Layout currentPageName={pageName}>
                      <PageComponent />
                    </Layout>
                  }
                />
              )}
            </React.Fragment>
          );
        })}
        {/* If a page is not found, redirect back to the main dashboard */}
        <Route path="*" element={<Navigate to={`/${mainPage}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
