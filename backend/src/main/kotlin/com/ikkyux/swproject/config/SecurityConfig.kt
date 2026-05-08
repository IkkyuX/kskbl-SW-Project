package com.ikkyux.swproject.config

import com.ikkyux.swproject.auth.AuthTokenFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
class SecurityConfig(
    private val authTokenFilter: AuthTokenFilter,
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/actuator/health",
                    "/api/v1/auth/**"
                ).permitAll()
                it.anyRequest().permitAll()
            }
            .addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter::class.java)
            .httpBasic(Customizer.withDefaults())
        return http.build()
    }
}
