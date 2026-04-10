package com.locationalarm.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String root(HttpSession session) {
        return session.getAttribute("userId") == null ? "redirect:/login" : "redirect:/dashboard";
    }

    @GetMapping("/login")
    public String loginPage(HttpSession session) {
        return session.getAttribute("userId") == null ? "login" : "redirect:/dashboard";
    }

    @GetMapping("/dashboard")
    public String dashboardPage(HttpSession session) {
        return session.getAttribute("userId") == null ? "redirect:/login" : "dashboard";
    }
}
