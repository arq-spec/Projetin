const fs = require('fs');
const content = fs.readFileSync('src/components/LoginDashboard.tsx', 'utf-8');

const newReturn = `  return (
    <div className="min-h-screen flex p-3 sm:p-6 font-sans text-neutral-900 select-none relative overflow-hidden items-center justify-center bg-slate-100">
      {/* Liquid Glass Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-300/50 rounded-full blur-[100px] mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-purple-300/50 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-rose-300/50 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-[1000px] mx-auto rounded-[2.5rem] flex overflow-hidden border border-white/60 relative z-10 bg-white/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] min-h-[650px]">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex w-[45%] p-4 relative">
          <div className="w-full h-full rounded-[2rem] overflow-hidden relative flex flex-col justify-between p-10 text-white shadow-inner bg-black/10 border border-white/20 backdrop-blur-md">
            {/* Glassy internal background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent mix-blend-overlay"></div>
            
            {/* Top Navigation inside image */}
            <div className="relative z-10 flex justify-between items-center font-semibold text-sm">
              <span className="font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                FRELLO Workspace
              </span>
            </div>

            <div className="relative z-10 text-neutral-900">
               <h2 className="text-3xl font-black mb-4 leading-tight">Inovação e<br/>Transparência</h2>
               <p className="text-sm font-medium text-neutral-700">Acesse nossa plataforma e gerencie seus projetos de forma ágil e segura, com uma interface pensada para você.</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[55%] flex flex-col p-8 sm:p-12 relative overflow-y-auto">
          {/* Top header */}
          <div className="flex justify-between items-center mb-12 sm:mb-16">
            <div className="font-black text-2xl tracking-tighter uppercase text-neutral-900 flex items-center gap-2">
              FRELLO
            </div>
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
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-3 drop-shadow-sm">
                      Olá
                    </h1>
                    <p className="text-neutral-600 text-sm font-medium">
                      Bem-vindo ao FRELLO
                    </p>
                  </div>
                  
                  <form onSubmit={handleIdentify} className="space-y-5">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Email ou CPF"
                        value={loginInput}
                        onChange={handleLoginChange}
                        className="w-full p-4 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner"
                        autoFocus
                      />
                    </div>
                    
                    {errorMsg && (
                      <div className="p-3 bg-red-100/80 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/30 cursor-pointer border border-white/20"
                      >
                        Continuar
                      </button>
                    </div>

                    <div className="text-center pt-6 pb-2">
                      <p className="text-xs text-neutral-600 font-medium">
                        Não tem uma conta? <button type="button" onClick={() => setStep('register')} className="text-purple-600 font-bold hover:underline cursor-pointer">Cadastre-se</button>
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
                    <div className="inline-flex items-center gap-3 bg-white/50 p-2 pr-4 rounded-full border border-white/60 mb-6 mx-auto cursor-pointer backdrop-blur-sm shadow-sm" onClick={() => setStep('identify')}>
                      <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                        {getRoleIcon(foundUser.perfil, "w-4 h-4")}
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-xs font-bold text-neutral-900">{foundUser.nome}</p>
                        <span className="text-[9px] text-neutral-600 uppercase font-bold">{foundUser.perfil}</span>
                      </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2 drop-shadow-sm">
                      Bem-vindo de volta
                    </h1>
                    <p className="text-neutral-600 text-sm font-medium">
                      Digite sua senha para continuar
                    </p>
                  </div>
                  
                  <form onSubmit={handleLoginWithPassword} className="space-y-5">
                    <div className="space-y-2 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        className="w-full p-4 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner pr-12"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <button type="button" className="text-xs text-purple-600 font-bold hover:underline cursor-pointer">
                        Esqueceu a senha?
                      </button>
                    </div>
                    
                    {errorMsg && (
                      <div className="p-3 bg-red-100/80 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/30 cursor-pointer border border-white/20"
                      >
                        Entrar
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
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900 mb-2 drop-shadow-sm">
                      Criar Senha
                    </h1>
                    <p className="text-neutral-600 text-sm font-medium">
                      Primeiro acesso para {foundUser.nome}
                    </p>
                  </div>
                  
                  <form onSubmit={handleSetNewPassword} className="space-y-5">
                    <div className="space-y-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nova Senha"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-4 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-2 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirmar Senha"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full p-4 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {errorMsg && (
                      <div className="p-3 bg-red-100/80 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/30 cursor-pointer border border-white/20"
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
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2 drop-shadow-sm">
                      Junte-se a nós
                    </h1>
                    <p className="text-neutral-600 text-sm font-medium">
                      Solicite acesso ao sistema
                    </p>
                  </div>
                  
                  {regSuccess ? (
                    <div className="flex flex-col items-center justify-center pt-4 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-400/20 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-500/30 backdrop-blur-md">
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
                        className="mt-6 w-full py-4 bg-white/50 border border-white/60 hover:bg-white/80 text-neutral-900 font-bold rounded-xl text-sm transition-all shadow-sm backdrop-blur-sm"
                      >
                        Voltar ao Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4 h-[350px] sm:h-auto overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/60 pb-10">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Nome" value={regNome} onChange={e => setRegNome(e.target.value)} required className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />
                        <input type="text" placeholder="Sobrenome" value={regSobrenome} onChange={e => setRegSobrenome(e.target.value)} required className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />
                      </div>

                      <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />

                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="CPF (11 dígitos)" value={regCpf} onChange={e => setRegCpf(formatCPF(e.target.value))} required className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />
                        <input type="text" placeholder="WhatsApp" value={regWhatsapp} onChange={e => setRegWhatsapp(formatPhone(e.target.value))} required className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />
                      </div>

                      <input type="text" placeholder="Cargo / Especialidade" value={regCargo} onChange={e => setRegCargo(e.target.value)} required className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />

                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Instagram (Opcional)" value={regInstagram} onChange={e => setRegInstagram(e.target.value)} className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />
                        <input type="text" placeholder="Site (Opcional)" value={regWebsite} onChange={e => setRegWebsite(e.target.value)} className="w-full p-3.5 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-medium text-sm placeholder:text-neutral-500 backdrop-blur-sm shadow-inner" />
                      </div>

                      {errorMsg && (
                        <div className="p-3 bg-red-100/80 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2 items-center font-medium backdrop-blur-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div className="pt-2 flex flex-col gap-3">
                        <button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/30 cursor-pointer border border-white/20"
                        >
                          Enviar Solicitação
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('identify')}
                          className="w-full py-4 text-neutral-600 font-bold hover:text-neutral-900 transition-colors text-sm cursor-pointer"
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
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 text-neutral-500">
              <div className="w-8 h-8 rounded-full border border-white/60 bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/60 hover:text-neutral-800 transition-colors cursor-pointer shadow-sm">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/60 bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/60 hover:text-neutral-800 transition-colors cursor-pointer shadow-sm">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/60 bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/60 hover:text-neutral-800 transition-colors cursor-pointer shadow-sm">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
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
  console.log('Successfully applied liquid glass');
} else {
  console.error('Could not find return block');
}
