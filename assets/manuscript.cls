\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{myarticle}[Article class of ylxdzsw's favor]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions

\LoadClass[a4paper, 11pt]{article}

\RequirePackage[left=1.1in,right=1.1in,top=1in,bottom=1in]{geometry}
\RequirePackage[utf8]{inputenc}

\makeatletter
    \def\@maketitle{%
  \newpage
  \null
  \begin{center}%
  \let \footnote \thanks
    {\LARGE \@title \par}%
    \vskip 1.5em%
    {\large
      \lineskip .5em%
      \begin{tabular}[t]{c}%
        \@author\quad\textbar\quad\@date
      \end{tabular}\par}%
  \end{center}%
  \par
  \vskip 1.5em}
\makeatother

\endinput
