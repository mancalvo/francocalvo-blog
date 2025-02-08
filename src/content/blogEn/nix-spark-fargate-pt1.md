---
author: Franco Calvo
pubDatetime: 2025-01-29T21:00:12Z
title: Poor man's AWS Glue - Nix + PySpark + Fargate
slug: nix+pyspark+fargate+1
featured: true
draft: false
ogImage: ../../assets/nix-spark-fargate/header.svg
tags:
  - nix
  - spark
  - fargate
description:
  Alternative to AWS Glue Jobs with the creation of Spark jobs in a serverless manner using Fargate, with reproducible and declarative builds and development environments using Nix. 
---

![Tech icons](../../assets/nix-spark-fargate/header.svg)

## Introduction

A recurring theme that we have recently faced in Draftea is the management of data when it is small enough to be processed most efficiently in _single-node_ engines, such as [DuckDB](https://duckdb.org/) or [Polars](https://pola.rs/).

Currently, most of the tools being developed in the data ecosystem are "Spark-centric," where JVM tools are _first-class citizens_, and from there, integrations are created to other spaces (although this seems to be changing, as with DataFow or Arrow).

This leads us to think about how we can leverage Spark integrations without necessarily "marrying" a framework that could be _overkill_ for our needs from the outset. In other words, the idea is to fully utilize the Spark integration platform while using tools that allow us to precisely modularize the resources it uses and that can also serve as a "springboard" to migrate to another tool with the least possible _overhead_.

## Declarative, serverless, and scalable

### Apache Iceberg as a catalyst

Let’s present a particular problem: Apache Iceberg. This is a _table format_ that originated at Netflix and was later donated to the Apache Foundation, which is defined as follows:

> [...] the Iceberg table format that is designed to manage a large, slow-changing collection of files in a distributed file system or key-value store as a table.

Currently, it is one of the most used and best-integrated formats in various tools, such as Snowflake, AWS Athena, AWS Glue Catalog, Dremio, Starrocks, etc. It offers ACID guarantees along with a host of other virtues that make it generally a central piece in modern data lakehouses, fulfilling a central role in what is called the _Modern Data Stack_.

However, the integration of Iceberg in languages or environments that are not in Spark or the JVM is still in early stages, such as [PyIceberg](https://github.com/apache/iceberg-python), the implementation in Python, which is still at version 0.8 at the time of writing this post, where important and useful aspects like `MERGE` DML commands that are available in Spark are missing. These functionalities could be fundamental in the efficient design of _SCD Type 2_ tables.

It is generally these _sharp edges_ that lead one to end up opting for Spark, even if it feels like using a sledgehammer to crack a nut. But that doesn’t mean we can’t optimize its use to reduce costs and manage the infrastructure in a way that allows us to evolve our solution when the ecosystem of packages within _single-node processors_ improves.

### Spark, but at what cost?

Now, understanding the need to use Spark even with small _datasets_, we have to consider the efficiency with which we are running our process. For example, a Glue job requires at least two DPUs (data processing units), each costing 0.44 USD/h. This can be a relatively high cost for processing small data.

An interesting alternative would be to run it standalone in **containers**. Additionally, one advantage of Glue is its serverless condition, which greatly reduces maintenance and eliminates cluster management. We can achieve that same benefit by running our jobs in containers on Fargate, with the flexibility to allocate as many resources as needed without managing clusters!

### Spark, Fargate... Nix?

![Iceberg is here too](../../assets/nix-spark-fargate/iceberg.svg)

As the title says, the proposal to this problem is "Nix + PySpark + Fargate." We have already explained the reasons for PySpark and Fargate, and now we move on to the third leg (and the most esoteric), which is key to achieving reproducible and declarative environments: **Nix**.

What is Nix? We can say it is a _package builder/manager_, a programming language, and an operating system (NixOS), and it has the quality of being declarative and fully reproducible. In this post, we will focus mainly on the first two qualities.

Using Nix will allow us, from a single file, to configure and declare: a development shell with all the necessary dependencies, an executable application, and a Docker image. All this without writing bash, TOML, or a Dockerfile (but yes, nix 😜).

In summary, Nix is a very useful tool that, in our case, will allow us to develop in a relatively complex environment (JVM, Python dependencies, and more) within a completely reproducible framework based on a declarative configuration file. This ensures that what we are running locally is exactly what we are packaging in an image and uploading to AWS.

For a bit more information, I recommend reading a bit from the [official page](https://nixos.org/explore/) or in Reddit communities.

#### But what about Poetry/uv/pipenv/etc!?!?!?!?

We are going to use it! Nix is agnostic to the language. Using tools like `uv2nix` or `poetry2nix`, it can perfectly integrate into our workflow, incorporating the advantages of Nix without losing integration with existing tooling.

In our case, development will be based on `uv`, but it could generally be replicated in the same way with any of the other package managers.

As a note, I have a repo (in development) that works as a kind of _quickstart_ to use Nix with uv: [nix-python-demo](https://github.com/francocalvo/nix-python-demo/tree/main)

### Spark? No, DuckDB 🥷

![enter duckdb](../../assets/nix-spark-fargate/duckdb.svg)

For people focused on [platform engineering](https://platformengineering.org/blog/what-is-platform-engineering), all of the above may seem super interesting. But what value does this bring to business or data teams? So far, we have been describing Spark with extra steps.

As we said at the beginning, we arrived at Spark out of necessity regarding integrations, not for its computing capacity, so when the ecosystem matures, it would be best to migrate quickly to it.

This is where everything we have been proposing adds a lot of value. DuckDB, one of the data processing engines that work on a single node, has implemented a [Spark API](https://duckdb.org/docs/api/python/spark_api.html). With the structure set up, within a Fargate container, with a complete toolchain in Python, and ideally with a CICD system that automatically integrates changes in ECR, the migration could be largely, and depending on the complexity of the system, just a couple of lines of code changes. Even in the worst-case scenario, the core of the business logic, transformations, and so on, could be maintained.

### Costs

An important question to ask when proposing this is, is it worth it? How much can the difference be between running our jobs on Fargate versus doing it in Glue jobs?

The answer is that, in cases where we can run our processes on a single node (less than 10-25GB of data), the difference can be significant. Bringing it to numbers, and taking as a reference the minimum configuration of Glue (2 DPUs) and the [minimum recommended configuration](https://spark.apache.org/docs/latest/hardware-provisioning.html) for Spark (8GB RAM 8vCPU), we can see the following costs:

- 2 DPU * 0.44 = 0.88 per hour.
- **8 * 0.04048 + 8 * 0.004445 = 0.3594 per hour**

That is, if our data is not large enough to need scaling, we could be paying almost 2.5 times more for its use! This, moreover, is improvable, because we could optimize the resources of each job in Fargate so that the difference could even be greater, as the DPUs increase discretely and in fairly large steps.

## Conclusion

While a second part of this post is needed to deploy the technical implementation of the proposal, the idea is to make it clear that there are good alternatives to using Spark in a serverless way, so that we can leverage its integrations.

Thus, our alternative of ‘Nix + PySpark + Fargate’ presents itself as a ‘poor man's AWS Glue’: it maintains flexibility and scalability, but with a more limited cost and complexity, and the possibility of migrating to lighter engines like DuckDB as the ecosystem allows. 
