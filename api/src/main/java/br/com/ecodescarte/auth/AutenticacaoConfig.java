package br.com.ecodescarte.auth;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Os registros exigem login; /api/login, /api/logout e /api/saude ficam abertos. */
@Configuration
public class AutenticacaoConfig implements WebMvcConfigurer {

    private final AutenticacaoInterceptor interceptor;

    public AutenticacaoConfig(AutenticacaoInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/residuos", "/api/residuos/**");
    }
}
