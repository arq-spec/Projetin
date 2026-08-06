const fs = require('fs');
const content = fs.readFileSync('src/components/LoginDashboard.tsx', 'utf-8');

const newReturn = `  return (
    <div className="min-h-screen bg-[#F0F2F5] flex p-3 sm:p-6 font-sans text-neutral-900 select-none">
      <div className="w-full max-w-[1280px] mx-auto bg-white rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-neutral-100">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex w-[45%] p-3 relative">
          <div className="w-full h-full rounded-[2rem] overflow-hidden relative flex flex-col justify-between p-10 text-white shadow-inner bg-neutral-950">
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
              alt="Space"
              className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-lighten"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>
            
            {/* Top Navigation inside image */}
            <div className="relative z-10 flex justify-between items-center font-semibold text-sm">
              <span className="font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Selected Works
              </span>
              <div className="flex gap-5 items-center">
                <button type="button" onClick={() => setStep('register')} className="hover:text-white/80 transition-colors cursor-pointer text-xs">Sign Up</button>
                <button type="button" onClick={() => setStep('register')} className="px-5 py-2 border border-white/30 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-xs">Join Us</button>
              </div>
            </div>

            {/* Bottom info inside image */}
            <div className="relative z-10 flex justify-between items-end">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-indigo-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="font-bold text-base">Andrew.ui</div>
                  <div className="text-xs text-white/70">UI & Illustration</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white cursor-pointer">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <button className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white cursor-pointer">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[55%] flex flex-col p-8 sm:p-12 relative overflow-y-auto">
          {/* Top header */}
          <div className="flex justify-between items-center mb-12 sm:mb-20">
            <div className="font-black text-2xl tracking-tighter uppercase text-neutral-900 flex items-center gap-2">
              FRELLO
            </div>
            <button className="flex items-center gap-2 border border-neutral-200 rounded-full px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
              <span className="text-sm">🇧🇷</span> PT <ChevronRight className="w-3 h-3 rotate-90" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {/* STEP 1: IDENTIFY USER */}
              {step === 'identify' && (
                <motion.div
                  key="identify-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  <div className="text-center mb-10 w-full">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-3">
                      Hi Designer
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium">
                      Welcome to FRELLO
                    </p>
                  </div>
                  
                  <form onSubmit={handleIdentify} className="space-y-5">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Email ou CPF"
                        value={loginInput}
                        onChange={handleLoginChange}
                        className="w-full p-4 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400"
                        autoFocus
                      />
                    </div>
                    
                    {errorMsg && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                      >
                        Continuar
                      </button>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-neutral-200"></div>
                      <span className="text-xs text-neutral-400 font-medium">or</span>
                      <div className="flex-1 h-px bg-neutral-200"></div>
                    </div>

                    <button type="button" className="w-full py-4 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold rounded-xl text-sm transition-all flex justify-center items-center gap-3 cursor-pointer">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Login with Google
                    </button>

                    <div className="text-center pt-4 pb-2">
                      <p className="text-xs text-neutral-500 font-medium">
                        Don't have an account? <button type="button" onClick={() => setStep('register')} className="text-red-500 font-bold hover:underline cursor-pointer">Sign up</button>
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 2A: PASSWORD REQUIRED */}
              {step === 'password' && foundUser && (
                <motion.div
                  key="password-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  <div className="text-center mb-8 w-full">
                    <div className="inline-flex items-center gap-3 bg-neutral-50 p-2 pr-4 rounded-full border border-neutral-200 mb-6 mx-auto cursor-pointer" onClick={() => setStep('identify')}>
                      <div className="p-1.5 bg-neutral-900 text-white rounded-full">
                        {getRoleIcon(foundUser.perfil, "w-4 h-4")}
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-xs font-bold text-neutral-900">{foundUser.nome}</p>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold">{foundUser.perfil}</span>
                      </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2">
                      Welcome Back
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium">
                      Enter your password to continue
                    </p>
                  </div>
                  
                  <form onSubmit={handleLoginWithPassword} className="space-y-5">
                    <div className="space-y-2 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        className="w-full p-4 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400 pr-12"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <button type="button" className="text-xs text-red-500 font-bold hover:underline cursor-pointer">
                        Forgot password ?
                      </button>
                    </div>
                    
                    {errorMsg && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 2B: SET INITIAL PASSWORD */}
              {step === 'set-password' && foundUser && (
                <motion.div
                  key="set-password-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  <div className="text-center mb-8 w-full">
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900 mb-2">
                      Create Password
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium">
                      First access for {foundUser.nome}
                    </p>
                  </div>
                  
                  <form onSubmit={handleSetNewPassword} className="space-y-5">
                    <div className="space-y-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-4 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-2 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full p-4 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {errorMsg && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                      >
                        Salvar e Entrar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP: REGISTER */}
              {step === 'register' && (
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  <div className="text-center mb-8 w-full">
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2">
                      Join Us
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium">
                      Request access to the system
                    </p>
                  </div>
                  
                  {regSuccess ? (
                    <div className="flex flex-col items-center justify-center pt-4 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-neutral-900 text-xl">Cadastro Enviado!</h3>
                      <p className="text-sm text-neutral-600 font-medium">
                        Sua solicitação está em análise. Retornaremos em breve.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('identify');
                          setRegSuccess(false);
                        }}
                        className="mt-6 w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-sm transition-all"
                      >
                        Voltar ao Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4 h-[350px] sm:h-auto overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-200 pb-10">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Nome" value={regNome} onChange={e => setRegNome(e.target.value)} required className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />
                        <input type="text" placeholder="Sobrenome" value={regSobrenome} onChange={e => setRegSobrenome(e.target.value)} required className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />
                      </div>

                      <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />

                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="CPF (11 dígitos)" value={regCpf} onChange={e => setRegCpf(formatCPF(e.target.value))} required className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />
                        <input type="text" placeholder="WhatsApp" value={regWhatsapp} onChange={e => setRegWhatsapp(formatPhone(e.target.value))} required className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />
                      </div>

                      <input type="text" placeholder="Cargo / Especialidade" value={regCargo} onChange={e => setRegCargo(e.target.value)} required className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />

                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Instagram (Opcional)" value={regInstagram} onChange={e => setRegInstagram(e.target.value)} className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />
                        <input type="text" placeholder="Site (Opcional)" value={regWebsite} onChange={e => setRegWebsite(e.target.value)} className="w-full p-3.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-sm placeholder:text-neutral-400" />
                      </div>

                      {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div className="pt-2 flex flex-col gap-3">
                        <button
                          type="submit"
                          className="w-full py-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                        >
                          Enviar Solicitação
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('identify')}
                          className="w-full py-4 text-neutral-500 font-bold hover:text-neutral-900 transition-colors text-sm cursor-pointer"
                        >
                          Voltar ao Login
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Social Icons Footer */}
          {step !== 'register' && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 text-neutral-400">
              <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-600 transition-colors cursor-pointer">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-600 transition-colors cursor-pointer">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-600 transition-colors cursor-pointer">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-600 transition-colors cursor-pointer">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const startIdx = content.indexOf('  return (\n');
if (startIdx !== -1) {
  const newFile = content.substring(0, startIdx) + newReturn;
  fs.writeFileSync('src/components/LoginDashboard.tsx', newFile);
  console.log('Successfully replaced layout');
} else {
  console.error('Could not find return block');
}
