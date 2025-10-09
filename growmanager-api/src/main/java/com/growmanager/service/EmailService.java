package com.growmanager.service;

import com.growmanager.entity.User;
import com.growmanager.exception.EmailSendException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

/**
 * Email Service for sending transactional emails.
 * Uses Thymeleaf templates for HTML email rendering.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.email.from}")
    private String emailFrom;

    @Value("${app.email.from-name}")
    private String emailFromName;

    @Autowired
    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    /**
     * Sends a verification email to a newly registered user.
     * Contains a link to verify their email address.
     *
     * @param user the user to send verification email to
     * @param verificationToken the verification token
     * @throws EmailSendException if email fails to send
     */
    public void sendVerificationEmail(User user, String verificationToken) {
        try {
            String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;

            Map<String, Object> variables = new HashMap<>();
            variables.put("username", user.getDisplayName() != null ? user.getDisplayName() : user.getEmail());
            variables.put("verificationLink", verificationLink);
            variables.put("email", user.getEmail());

            String subject = "Verify Your GrowManager Account";
            String htmlContent = renderTemplate("emails/verification-email", variables);

            sendHtmlEmail(user.getEmail(), subject, htmlContent);

            logger.info("Verification email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send verification email to: {}", user.getEmail(), e);
            throw new EmailSendException("Failed to send verification email", e);
        }
    }

    /**
     * Sends a password reset email with a link to reset password.
     *
     * @param user the user requesting password reset
     * @param resetToken the password reset token
     * @throws EmailSendException if email fails to send
     */
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            Map<String, Object> variables = new HashMap<>();
            variables.put("username", user.getDisplayName() != null ? user.getDisplayName() : user.getEmail());
            variables.put("resetLink", resetLink);
            variables.put("email", user.getEmail());

            String subject = "Reset Your GrowManager Password";
            String htmlContent = renderTemplate("emails/password-reset-email", variables);

            sendHtmlEmail(user.getEmail(), subject, htmlContent);

            logger.info("Password reset email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", user.getEmail(), e);
            throw new EmailSendException("Failed to send password reset email", e);
        }
    }

    /**
     * Sends a password reset confirmation email after successful password reset.
     *
     * @param user the user whose password was reset
     * @throws EmailSendException if email fails to send
     */
    public void sendPasswordResetConfirmationEmail(User user) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("username", user.getDisplayName() != null ? user.getDisplayName() : user.getEmail());
            variables.put("email", user.getEmail());
            variables.put("loginLink", frontendUrl + "/login");

            String subject = "Your GrowManager Password Has Been Reset";
            String htmlContent = renderTemplate("emails/password-reset-confirmation", variables);

            sendHtmlEmail(user.getEmail(), subject, htmlContent);

            logger.info("Password reset confirmation email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send password reset confirmation email to: {}", user.getEmail(), e);
            throw new EmailSendException("Failed to send password reset confirmation email", e);
        }
    }

    /**
     * Renders a Thymeleaf email template with the given variables.
     *
     * @param templateName the name of the template (without .html extension)
     * @param variables the variables to pass to the template
     * @return the rendered HTML content
     */
    private String renderTemplate(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        return templateEngine.process(templateName, context);
    }

    /**
     * Sends an HTML email to the specified recipient.
     *
     * @param to the recipient email address
     * @param subject the email subject
     * @param htmlContent the HTML content of the email
     * @throws MessagingException if email fails to send
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(emailFrom, emailFromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
        logger.debug("HTML email sent to: {}", to);
    }
}