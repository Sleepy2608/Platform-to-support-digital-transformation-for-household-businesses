package com.hbdt.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey jwtSecretKey;
    private final long jwtAccessExpirationMs;
    private final long jwtRefreshExpirationMs;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.access-expiration-ms}") long jwtAccessExpirationMs,
            @Value("${jwt.refresh-expiration-ms}") long jwtRefreshExpirationMs) {
        this.jwtSecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        this.jwtAccessExpirationMs = jwtAccessExpirationMs;
        this.jwtRefreshExpirationMs = jwtRefreshExpirationMs;
    }

    /**
     * Generate access token from Authentication object.
     */
    public String generateAccessToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtAccessExpirationMs);

        String roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(jwtSecretKey)
                .compact();
    }

    /**
     * Generate refresh token with longer expiry.
     */
    public String generateRefreshToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtRefreshExpirationMs);

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("token_type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(jwtSecretKey)
                .compact();
    }

    /**
     * Generate access token from username (used during refresh).
     */
    public String generateAccessTokenFromUsername(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtAccessExpirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(jwtSecretKey)
                .compact();
    }

    /**
     * Extract username (subject) from JWT token.
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(jwtSecretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Validate the JWT token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(jwtSecretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }
}
